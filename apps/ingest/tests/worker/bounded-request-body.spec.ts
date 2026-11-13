import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  RequestBodyTooLargeError,
  readBoundedRequestBody,
} from "../../src/worker/bounded-request-body";

function streamingRequest(chunks: readonly Uint8Array[]): Request {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(chunk);
      }
      controller.close();
    },
  });
  return new Request("http://localhost/ingest/topic", {
    method: "POST",
    body: stream,
    duplex: "half",
  } as RequestInit);
}

const MAXIMUM_BYTES = 64;

describe("reading a bounded request body", () => {
  it("accepts exactly the bytes streamed when within the bound and refuses otherwise", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.uint8Array({ maxLength: 40 }), { maxLength: 6 }),
        async (chunks) => {
          const total = chunks.reduce(
            (sum, chunk) => sum + chunk.byteLength,
            0,
          );
          const outcome = readBoundedRequestBody(
            streamingRequest(chunks),
            MAXIMUM_BYTES,
          );
          if (total > MAXIMUM_BYTES) {
            await expect(outcome).rejects.toBeInstanceOf(
              RequestBodyTooLargeError,
            );
            return;
          }
          const expected = new Uint8Array(total);
          let offset = 0;
          for (const chunk of chunks) {
            expected.set(chunk, offset);
            offset += chunk.byteLength;
          }
          expect(await outcome).toStrictEqual(expected);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("refuses a declared length over the bound before reading", async () => {
    const request = new Request("http://localhost/x", {
      method: "POST",
      body: new Uint8Array(MAXIMUM_BYTES + 1),
    });
    await expect(
      readBoundedRequestBody(request, MAXIMUM_BYTES),
    ).rejects.toBeInstanceOf(RequestBodyTooLargeError);
  });

  it("reads an absent body as empty", async () => {
    const request = new Request("http://localhost/x", { method: "PUT" });
    expect(await readBoundedRequestBody(request, MAXIMUM_BYTES)).toStrictEqual(
      new Uint8Array(0),
    );
  });
});
