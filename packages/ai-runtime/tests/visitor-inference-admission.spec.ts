import { describe, expect, it, vi } from "vitest";
import fc from "fast-check";
import { admitVisitorInference, visitorRateLimitKey } from "../src/index.ts";

function visitorAdmissionEnvironment({
  burstSuccess = true,
  quotaResponse = () => Response.json({ admitted: true }),
}: {
  burstSuccess?: boolean;
  quotaResponse?: () => Response;
} = {}) {
  const limit = vi.fn(async () => ({ success: burstSuccess }));
  const quotaFetch = vi.fn(async () => quotaResponse());
  const idFromName = vi.fn((name: string) => `quota:${name}`);
  const get = vi.fn(() => ({ fetch: quotaFetch }));
  return {
    environment: {
      INFERENCE_RATE_LIMITER: { limit },
      VISITOR_INFERENCE_QUOTA: { idFromName, get },
    },
    limit,
    quotaFetch,
    idFromName,
    get,
  };
}

describe("visitor inference admission", () => {
  it("refuses every environment without a usable limiter and quota", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.jsonValue(),
        fc.option(fc.string()),
        async (environment, address) => {
          await expect(
            Reflect.apply(admitVisitorInference, undefined, [
              environment,
              address,
            ]),
          ).resolves.toBe(false);
        },
      ),
      { numRuns: 100 },
    );
    const { environment } = visitorAdmissionEnvironment();
    for (const partial of [
      { INFERENCE_RATE_LIMITER: environment.INFERENCE_RATE_LIMITER },
      { VISITOR_INFERENCE_QUOTA: environment.VISITOR_INFERENCE_QUOTA },
    ])
      await expect(admitVisitorInference(partial, "203.0.113.7")).resolves.toBe(
        false,
      );
  });

  it("admits exactly when both the burst limiter and the visitor quota admit", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.boolean(),
        fc.boolean(),
        fc.ipV4(),
        async (burstSuccess, quotaAdmits, address) => {
          const { environment, limit, quotaFetch, idFromName } =
            visitorAdmissionEnvironment({
              burstSuccess,
              quotaResponse: () => Response.json({ admitted: quotaAdmits }),
            });
          await expect(
            admitVisitorInference(environment, address),
          ).resolves.toBe(burstSuccess && quotaAdmits);
          expect(limit).toHaveBeenCalledExactlyOnceWith({ key: address });
          if (burstSuccess) {
            expect(idFromName).toHaveBeenCalledExactlyOnceWith(address);
            expect(quotaFetch).toHaveBeenCalledOnce();
          } else expect(quotaFetch).not.toHaveBeenCalled();
        },
      ),
      { numRuns: 100 },
    );
  });

  it("pools visitors without an address under one shared budget", async () => {
    for (const address of [null, "", "   "]) {
      const { environment, limit, idFromName } = visitorAdmissionEnvironment();
      await admitVisitorInference(environment, address);
      expect(limit).toHaveBeenCalledWith({ key: "unidentified-visitor" });
      expect(idFromName).toHaveBeenCalledWith("unidentified-visitor");
    }
  });

  it("refuses when the limiter or the quota fails or answers ambiguously", async () => {
    const failingLimiter = visitorAdmissionEnvironment();
    failingLimiter.limit.mockRejectedValue(new Error("limiter unavailable"));
    await expect(
      admitVisitorInference(failingLimiter.environment, "203.0.113.7"),
    ).resolves.toBe(false);
    for (const quotaResponse of [
      () => {
        throw new Error("quota unavailable");
      },
      () => Response.json({ admitted: true }, { status: 500 }),
      () => Response.json({ admitted: "true" }),
      () => Response.json(null),
      () => new Response("admitted"),
    ]) {
      const { environment } = visitorAdmissionEnvironment({ quotaResponse });
      await expect(
        admitVisitorInference(environment, "203.0.113.7"),
      ).resolves.toBe(false);
    }
  });
});

const hextet = fc.oneof(fc.constant(0), fc.integer({ min: 0, max: 0xffff }));
const ipv6Groups = fc.array(hextet, { minLength: 8, maxLength: 8 });

function zeroRunLength(groups: number[], start: number): number {
  let length = 0;
  while (start + length < groups.length && groups[start + length] === 0)
    length += 1;
  return length;
}

function formatIpv6(
  groups: number[],
  compressionStart: number | null,
  uppercase: boolean,
): string {
  const text = groups.map((group) => group.toString(16));
  const runLength =
    compressionStart === null ? 0 : zeroRunLength(groups, compressionStart);
  const formatted =
    compressionStart !== null && runLength > 0
      ? `${text.slice(0, compressionStart).join(":")}::${text
          .slice(compressionStart + runLength)
          .join(":")}`
      : text.join(":");
  return uppercase ? formatted.toUpperCase() : formatted;
}

const ipv6Address = fc
  .tuple(
    ipv6Groups,
    fc.option(fc.integer({ min: 0, max: 7 }), { nil: null }),
    fc.boolean(),
  )
  .map(([groups, compressionStart, uppercase]) => ({
    groups,
    address: formatIpv6(groups, compressionStart, uppercase),
  }));

describe("visitor rate limit key", () => {
  it("charges every address in one IPv6 /64 to the same budget", () => {
    fc.assert(
      fc.property(
        ipv6Address,
        fc.array(hextet, { minLength: 4, maxLength: 4 }),
        ({ groups, address }, interfaceIdentifier) => {
          const sibling = formatIpv6(
            [...groups.slice(0, 4), ...interfaceIdentifier],
            null,
            false,
          );
          expect(visitorRateLimitKey(address)).toBe(
            visitorRateLimitKey(sibling),
          );
        },
      ),
      { numRuns: 300 },
    );
  });

  it("keeps distinct IPv6 /64 prefixes on distinct budgets", () => {
    fc.assert(
      fc.property(ipv6Address, ipv6Address, (first, second) => {
        fc.pre(
          first.groups.slice(0, 4).join() !== second.groups.slice(0, 4).join(),
        );
        expect(visitorRateLimitKey(first.address)).not.toBe(
          visitorRateLimitKey(second.address),
        );
      }),
      { numRuns: 300 },
    );
  });

  it("keys IPv4 visitors by their full address", () => {
    fc.assert(
      fc.property(fc.ipV4(), (address) => {
        expect(visitorRateLimitKey(address)).toBe(address);
        expect(visitorRateLimitKey(`::ffff:${address}`)).toBe(address);
      }),
      { numRuns: 100 },
    );
  });

  it("matches the subnet key for a canonical documentation address", () => {
    expect(visitorRateLimitKey("2001:DB8::1")).toBe("2001:db8:0:0::/64");
  });
});
