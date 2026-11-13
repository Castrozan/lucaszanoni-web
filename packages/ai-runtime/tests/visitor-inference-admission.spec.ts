import { describe, expect, it, vi } from "vitest";
import fc from "fast-check";
import { admitVisitorInference } from "../src/index.ts";

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
