import fc from "fast-check";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createD1ArtifactObjectWriter } from "../../src/storage/d1-artifact-object-writer";
import { createD1SnapshotObjectReader } from "../../src/storage/d1-snapshot-object-reader";
import { createD1SnapshotObjectWriter } from "../../src/storage/d1-snapshot-object-writer";
import type { SnapshotDatabase } from "../../src/storage/snapshot-database";
import { openLocalD1Store, type LocalD1Store } from "./local-d1-store";
import { eventKeyFor, recordProducedAt } from "./snapshot-write-helpers";

let store: LocalD1Store;
let measuredDatabase: SnapshotDatabase;
let rowsWritten = 0;

beforeAll(async () => {
  store = await openLocalD1Store();
});
afterAll(async () => {
  await store?.dispose();
});
beforeEach(async () => {
  await store.clear();
  rowsWritten = 0;
  measuredDatabase = {
    prepare: (query) => store.database.prepare(query),
    batch: async <T>(statements: D1PreparedStatement[]) => {
      const results = await store.database.batch<T>(statements);
      for (const result of results) {
        expect(Number.isInteger(result.meta.rows_written)).toBe(true);
        rowsWritten += result.meta.rows_written;
      }
      return results;
    },
  };
});

describe("native D1 write costs for idempotent ingestion", () => {
  it("does not write rows for arbitrary identical artifact replays", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uint8Array({ maxLength: 4096 }),
        fc.constantFrom("text/html", "application/octet-stream"),
        fc.constantFrom("report" as const, "raw-snapshot" as const),
        async (bytes, contentType, objectKind) => {
          await store.clear();
          const writer = createD1ArtifactObjectWriter(measuredDatabase);
          const artifact = {
            objectKey:
              objectKind === "report"
                ? "reports/replay.bin"
                : "snapshots/account-machine.json",
            objectKind,
            contentType,
            bytes,
          };
          await writer.writeArtifact(artifact);
          rowsWritten = 0;
          const storage = await writer.writeArtifact(artifact);
          expect(rowsWritten).toBe(0);
          expect(storage.rowsWritten).toBe(0);
          expect(Number.isSafeInteger(storage.rowsRead)).toBe(true);
          expect(
            await createD1SnapshotObjectReader(
              store.database,
            ).readSnapshotObject(artifact.objectKey),
          ).toStrictEqual({ body: bytes, contentType });
        },
      ),
      { numRuns: 35 },
    );
  });

  it("refuses absent native statistics instead of reporting zero writes", async () => {
    const writer = createD1ArtifactObjectWriter({
      prepare: (query) => store.database.prepare(query),
      batch: async () => [],
    });
    await expect(
      writer.writeArtifact({
        objectKey: "reports/missing-statistics.bin",
        objectKind: "report",
        contentType: "application/octet-stream",
        bytes: new Uint8Array([1]),
      }),
    ).rejects.toThrow("incomplete write statistics");
  });

  it("rejects invalid native row counts across their numeric input space", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc
          .double()
          .filter((value) => !Number.isSafeInteger(value) || value < 0),
        async (invalidCount) => {
          const writer = createD1ArtifactObjectWriter({
            prepare: (query) => store.database.prepare(query),
            batch: async <T>(statements: D1PreparedStatement[]) => {
              const results = await store.database.batch<T>(statements);
              return results.map((result) => ({
                ...result,
                meta: { ...result.meta, rows_written: invalidCount },
              }));
            },
          });
          await expect(
            writer.writeArtifact({
              objectKey: "reports/invalid-statistics.bin",
              objectKind: "report",
              contentType: "application/octet-stream",
              bytes: new Uint8Array([1]),
            }),
          ).rejects.toThrow("invalid write statistics");
        },
      ),
      { numRuns: 20 },
    );
  });

  it("does not update an identical immutable event or its latest pointer", async () => {
    const producedAt = "2026-11-17T00:00:00.000Z";
    const writer = createD1SnapshotObjectWriter(measuredDatabase);
    const snapshot = {
      eventObjectKey: eventKeyFor(producedAt),
      record: recordProducedAt(producedAt),
    };
    await writer.writeSnapshot(snapshot);
    rowsWritten = 0;
    await writer.writeSnapshot(snapshot);
    expect(rowsWritten).toBe(0);
  });

  it("preserves same-length changes, metadata changes, and shrinking bodies", async () => {
    const writer = createD1ArtifactObjectWriter(measuredDatabase);
    const reader = createD1SnapshotObjectReader(store.database);
    const artifact = {
      objectKey: "reports/changes.bin",
      objectKind: "report" as const,
      contentType: "text/plain",
      bytes: new Uint8Array([1, 2, 3]),
    };
    await writer.writeArtifact(artifact);
    for (const next of [
      { ...artifact, bytes: new Uint8Array([3, 2, 1]) },
      {
        ...artifact,
        contentType: "application/octet-stream",
        bytes: new Uint8Array([3, 2, 1]),
      },
      { ...artifact, bytes: new Uint8Array() },
    ]) {
      await writer.writeArtifact(next);
      expect(await reader.readSnapshotObject(next.objectKey)).toStrictEqual({
        body: next.bytes,
        contentType: next.contentType,
      });
    }
  });
});
