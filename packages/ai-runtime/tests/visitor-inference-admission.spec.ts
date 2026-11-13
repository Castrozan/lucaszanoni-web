import { describe, expect, it, vi } from "vitest";
import fc from "fast-check";
import { admitVisitorInference, visitorRateLimitKey } from "../src/index.ts";

describe("visitor inference admission", () => {
  it("refuses every environment without a usable rate limiter", async () => {
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
  });

  it("admits exactly when the limiter admits the visitor's address", async () => {
    await fc.assert(
      fc.asyncProperty(fc.boolean(), fc.ipV4(), async (success, address) => {
        const limit = vi.fn(async () => ({ success }));
        await expect(
          admitVisitorInference({ INFERENCE_RATE_LIMITER: { limit } }, address),
        ).resolves.toBe(success);
        expect(limit).toHaveBeenCalledExactlyOnceWith({ key: address });
      }),
      { numRuns: 100 },
    );
  });

  it("pools visitors without an address under one shared budget", async () => {
    for (const address of [null, "", "   "]) {
      const limit = vi.fn(async () => ({ success: true }));
      await admitVisitorInference(
        { INFERENCE_RATE_LIMITER: { limit } },
        address,
      );
      expect(limit).toHaveBeenCalledWith({ key: "unidentified-visitor" });
    }
  });

  it("refuses when the limiter fails", async () => {
    const limit = vi.fn(async () => {
      throw new Error("limiter unavailable");
    });
    await expect(
      admitVisitorInference(
        { INFERENCE_RATE_LIMITER: { limit } },
        "203.0.113.7",
      ),
    ).resolves.toBe(false);
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
