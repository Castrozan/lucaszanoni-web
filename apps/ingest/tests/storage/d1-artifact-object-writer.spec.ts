import fc from "fast-check";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createD1ArtifactObjectWriter } from "../../src/storage/d1-artifact-object-writer";
import { createD1SnapshotObjectReader } from "../../src/storage/d1-snapshot-object-reader";
import { openLocalD1Store, type LocalD1Store } from "./local-d1-store";
import { patternedBytes } from "./patterned-bytes";

let store: LocalD1Store;

beforeAll(async () => {
  store = await openLocalD1Store();
});
afterAll(async () => {
  await store?.dispose();
});
beforeEach(async () => {
  await store.clear();
});

function writeReport(
  objectKey: string,
  bytes: Uint8Array,
  contentType: string,
) {
  return createD1ArtifactObjectWriter(store.database).writeArtifact({
    objectKey,
    objectKind: "report",
    contentType,
    bytes,
  });
}

async function chunkCountOf(objectKey: string): Promise<number> {
  const row = await store.database
    .prepare(
      "SELECT COUNT(*) AS chunks FROM snapshot_object_chunks WHERE object_key = ?1",
    )
    .bind(objectKey)
    .first<{ chunks: number }>();
  return row?.chunks ?? -1;
}

describe("round-tripping artifact bytes through D1", () => {
  it("returns arbitrary binary bytes exactly with their content type", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uint8Array({ maxLength: 4096 }),
        fc.constantFrom(
          "application/json",
          "text/html; charset=utf-8",
          "application/octet-stream",
        ),
        async (bytes, contentType) => {
          await writeReport("reports/arbitrary.bin", bytes, contentType);
          const stored = await createD1SnapshotObjectReader(
            store.database,
          ).readSnapshotObject("reports/arbitrary.bin");
          expect(stored).toStrictEqual({ body: bytes, contentType });
        },
      ),
      { numRuns: 40 },
    );
  });

  it.each([0, 1, 999_999, 1_000_000, 1_000_001, 2_000_001])(
    "returns exactly %i bytes and the minimal number of chunks",
    async (length) => {
      const bytes = patternedBytes(length, 3);
      await writeReport(
        "reports/boundary.bin",
        bytes,
        "application/octet-stream",
      );
      const stored = await createD1SnapshotObjectReader(
        store.database,
      ).readSnapshotObject("reports/boundary.bin");
      expect(Buffer.compare(stored?.body ?? new Uint8Array(1), bytes)).toBe(0);
      expect(await chunkCountOf("reports/boundary.bin")).toBe(
        Math.ceil(length / 1_000_000),
      );
    },
    60_000,
  );

  it("stores a four-million-byte artifact in four chunks and returns it exactly", async () => {
    const bytes = patternedBytes(4_000_000, 9);
    await writeReport("reports/maximum.bin", bytes, "application/octet-stream");
    const stored = await createD1SnapshotObjectReader(
      store.database,
    ).readSnapshotObject("reports/maximum.bin");
    expect(Buffer.compare(stored?.body ?? new Uint8Array(), bytes)).toBe(0);
    expect(await chunkCountOf("reports/maximum.bin")).toBe(4);
  }, 60_000);

  it("keeps multi-byte characters intact when a chunk boundary splits one", async () => {
    const text = `${"a".repeat(999_999)}日本語🎌${"é".repeat(5)}`;
    const bytes = new TextEncoder().encode(text);
    await writeReport(
      "reports/unicode.txt",
      bytes,
      "text/plain; charset=utf-8",
    );
    const stored = await createD1SnapshotObjectReader(
      store.database,
    ).readSnapshotObject("reports/unicode.txt");
    expect(new TextDecoder().decode(stored?.body)).toBe(text);
    expect(await chunkCountOf("reports/unicode.txt")).toBe(2);
  });

  it("replaces the chunks of an overwritten object and leaves unrelated objects alone", async () => {
    await writeReport(
      "reports/other.json",
      new TextEncoder().encode("{}"),
      "application/json",
    );
    await writeReport(
      "reports/current.json",
      patternedBytes(2_500_000, 1),
      "application/json",
    );
    await writeReport(
      "reports/current.json",
      new TextEncoder().encode("[1]"),
      "application/json",
    );
    const reader = createD1SnapshotObjectReader(store.database);
    expect(
      (await reader.readSnapshotObject("reports/current.json"))?.body,
    ).toStrictEqual(new TextEncoder().encode("[1]"));
    expect(await chunkCountOf("reports/current.json")).toBe(1);
    expect(
      (await reader.readSnapshotObject("reports/other.json"))?.body,
    ).toStrictEqual(new TextEncoder().encode("{}"));
  });

  it("answers null for a missing object and a topic without a latest pointer", async () => {
    const reader = createD1SnapshotObjectReader(store.database);
    expect(await reader.readSnapshotObject("reports/missing.json")).toBeNull();
    expect(
      await reader.readSnapshotObject(
        "snapshots/dotfiles-test-baseline/latest.json",
      ),
    ).toBeNull();
  });
});
