import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  MAXIMUM_CHUNK_BYTES,
  concatenateChunks,
  splitIntoChunks,
} from "../../src/storage/object-chunking";
import { patternedBytes } from "./patterned-bytes";

describe("splitting an object into row-sized chunks", () => {
  it("keeps every chunk within the limit and loses no byte for any length", () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 4_100_000 }),
        fc.nat({ max: 255 }),
        (length, seed) => {
          const bytes = patternedBytes(length, seed);
          const chunks = splitIntoChunks(bytes);
          expect(
            chunks.every((chunk) => chunk.byteLength <= MAXIMUM_CHUNK_BYTES),
          ).toBe(true);
          expect(chunks).toHaveLength(Math.ceil(length / MAXIMUM_CHUNK_BYTES));
          expect(Buffer.compare(concatenateChunks(chunks), bytes)).toBe(0);
        },
      ),
      { numRuns: 25 },
    );
  });

  it("pins the exact boundaries around one chunk", () => {
    for (const [length, chunkCount] of [
      [0, 0],
      [1, 1],
      [MAXIMUM_CHUNK_BYTES - 1, 1],
      [MAXIMUM_CHUNK_BYTES, 1],
      [MAXIMUM_CHUNK_BYTES + 1, 2],
    ] as const) {
      expect(splitIntoChunks(patternedBytes(length, 3))).toHaveLength(
        chunkCount,
      );
    }
  });
});
