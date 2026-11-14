import { describe, expect, it } from "vitest";
import fc from "fast-check";
import {
  createGenerationRefusalResponse,
  readGuardedJsonRequestBody,
} from "../src/public-generation-request.ts";

const maximumBodyBytes = 64;

function jsonRequest(
  body: BodyInit,
  headers: Record<string, string> = {},
): Request {
  return new Request("https://example.test/app/api", {
    method: "POST",
    body,
    headers: { "content-type": "application/json", ...headers },
  });
}

describe("readGuardedJsonRequestBody", () => {
  it("returns any UTF-8 body within the byte limit unchanged", async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ unit: "grapheme" }), async (text) => {
        fc.pre(new TextEncoder().encode(text).byteLength <= maximumBodyBytes);
        const reading = await readGuardedJsonRequestBody(
          jsonRequest(text),
          maximumBodyBytes,
        );
        expect(reading).toEqual({ status: "read", text });
      }),
    );
  });

  it("refuses every body above the byte limit with 413", async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 512 }), async (excess) => {
        const reading = await readGuardedJsonRequestBody(
          jsonRequest("x".repeat(maximumBodyBytes + excess)),
          maximumBodyBytes,
        );
        expect(reading).toEqual({ status: "refused", refusalStatus: 413 });
      }),
    );
  });

  it("refuses cross-site requests before reading the body", async () => {
    const reading = await readGuardedJsonRequestBody(
      jsonRequest("{}", { "sec-fetch-site": " Cross-Site " }),
      maximumBodyBytes,
    );
    expect(reading).toEqual({ status: "refused", refusalStatus: 403 });
  });

  it("accepts only the application/json media type", async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), async (mediaType) => {
        const request = new Request("https://example.test/app/api", {
          method: "POST",
          body: "{}",
          headers: { "content-type": mediaType },
        });
        const reading = await readGuardedJsonRequestBody(
          request,
          maximumBodyBytes,
        );
        const isJson =
          mediaType.split(";")[0]?.trim().toLowerCase() === "application/json";
        expect(reading.status === "read").toBe(isJson);
      }),
      { examples: [["application/json; charset=utf-8"], ["text/plain"]] },
    );
  });

  it("refuses bodies that are not valid UTF-8 with 400", async () => {
    const reading = await readGuardedJsonRequestBody(
      jsonRequest(new Uint8Array([0x7b, 0xff, 0x7d])),
      maximumBodyBytes,
    );
    expect(reading).toEqual({ status: "refused", refusalStatus: 400 });
  });
});

describe("createGenerationRefusalResponse", () => {
  it("is never cached and carries retry-after only when rate limited", () => {
    fc.assert(
      fc.property(fc.integer({ min: 400, max: 599 }), (status) => {
        const response = createGenerationRefusalResponse(status, "refused");
        expect(response.status).toBe(status);
        expect(response.headers.get("cache-control")).toBe("private, no-store");
        expect(response.headers.get("x-content-type-options")).toBe("nosniff");
        expect(response.headers.get("retry-after")).toBe(
          status === 429 ? "60" : null,
        );
      }),
    );
  });
});
