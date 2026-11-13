import type { IngestedSnapshotRecord } from "@platform/ingestion-contracts";
import fc from "fast-check";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createD1SnapshotObjectReader } from "../../src/storage/d1-snapshot-object-reader";
import { createD1SnapshotObjectWriter } from "../../src/storage/d1-snapshot-object-writer";
import { testBaselineEventFixture } from "../ingest-test-fixtures";
import { openLocalD1Store, type LocalD1Store } from "./local-d1-store";
import {
  baselineLatestKey as latestKey,
  eventKeyFor,
  receivedAt,
  recordProducedAt,
} from "./snapshot-write-helpers";

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

describe("writing a snapshot to D1", () => {
  it("stores the exact record bytes under the event key and serves them as latest", async () => {
    const record = recordProducedAt("2026-07-24T03:26:24.774Z");
    const eventObjectKey = eventKeyFor("2026-07-24T03:26:24.774Z");
    await createD1SnapshotObjectWriter(store.database).writeSnapshot({
      eventObjectKey,
      record,
    });
    const reader = createD1SnapshotObjectReader(store.database);
    const expected = new TextEncoder().encode(JSON.stringify(record));
    const event = await reader.readSnapshotObject(eventObjectKey);
    const latest = await reader.readSnapshotObject(latestKey);
    expect(event).toStrictEqual({
      body: expected,
      contentType: "application/json",
    });
    expect(latest).toStrictEqual(event);
  });

  it("keeps Unicode intact across the record round trip", async () => {
    const record = {
      receivedAt,
      event: {
        ...testBaselineEventFixture,
        producer: "produtor-ação-日本語-🎌",
      },
    } as unknown as IngestedSnapshotRecord;
    const eventObjectKey = eventKeyFor("2026-07-24T03:26:24.774Z");
    await createD1SnapshotObjectWriter(store.database).writeSnapshot({
      eventObjectKey,
      record,
    });
    const stored = await createD1SnapshotObjectReader(
      store.database,
    ).readSnapshotObject(eventObjectKey);
    expect(JSON.parse(new TextDecoder().decode(stored?.body))).toStrictEqual(
      record,
    );
  });

  it("repeats a same-key write without duplicating chunks", async () => {
    const writer = createD1SnapshotObjectWriter(store.database);
    const write = {
      eventObjectKey: eventKeyFor("2026-07-24T03:26:24.774Z"),
      record: recordProducedAt("2026-07-24T03:26:24.774Z"),
    };
    await writer.writeSnapshot(write);
    await writer.writeSnapshot(write);
    const counts = await store.database
      .prepare(
        "SELECT (SELECT COUNT(*) FROM snapshot_objects) AS objects, (SELECT COUNT(*) FROM snapshot_object_chunks) AS chunks, (SELECT COUNT(*) FROM snapshot_latest) AS latest",
      )
      .first();
    expect(counts).toStrictEqual({ objects: 1, chunks: 1, latest: 1 });
  });

  it("preserves the first event and latest bytes for arbitrary same-key retry metadata", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 128 }),
        async (producer) => {
          await store.clear();
          const original = recordProducedAt("2026-07-24T03:26:24.774Z");
          const eventObjectKey = eventKeyFor(original.event.producedAt);
          const writer = createD1SnapshotObjectWriter(store.database);
          await writer.writeSnapshot({ eventObjectKey, record: original });
          await writer.writeSnapshot({
            eventObjectKey,
            record: {
              ...original,
              receivedAt: "2026-07-25T00:00:00.000Z",
              event: { ...original.event, producer },
            },
          });
          const reader = createD1SnapshotObjectReader(store.database);
          for (const key of [eventObjectKey, latestKey]) {
            const stored = await reader.readSnapshotObject(key);
            expect(new TextDecoder().decode(stored?.body)).toBe(
              JSON.stringify(original),
            );
          }
        },
      ),
      { numRuns: 20 },
    );
  });

  it("does not append chunks when a later same-key event is larger than the original", async () => {
    const original = recordProducedAt("2026-07-24T03:26:24.774Z");
    const eventObjectKey = eventKeyFor(original.event.producedAt);
    const writer = createD1SnapshotObjectWriter(store.database);
    await writer.writeSnapshot({ eventObjectKey, record: original });
    await writer.writeSnapshot({
      eventObjectKey,
      record: {
        ...original,
        event: { ...original.event, producer: "x".repeat(1_000_001) },
      },
    });
    const stored = await createD1SnapshotObjectReader(
      store.database,
    ).readSnapshotObject(eventObjectKey);
    expect(new TextDecoder().decode(stored?.body)).toBe(
      JSON.stringify(original),
    );
    expect(
      await store.database
        .prepare("SELECT COUNT(*) AS chunks FROM snapshot_object_chunks")
        .first(),
    ).toStrictEqual({ chunks: 1 });
  });

  it("rolls back the event object when the latest pointer cannot be written", async () => {
    await store.database
      .prepare(
        "CREATE TRIGGER refuse_latest BEFORE INSERT ON snapshot_latest BEGIN SELECT RAISE(ABORT, 'latest refused'); END",
      )
      .run();
    try {
      await expect(
        createD1SnapshotObjectWriter(store.database).writeSnapshot({
          eventObjectKey: eventKeyFor("2026-07-24T03:26:24.774Z"),
          record: recordProducedAt("2026-07-24T03:26:24.774Z"),
        }),
      ).rejects.toThrow(/latest refused/);
      const counts = await store.database
        .prepare(
          "SELECT (SELECT COUNT(*) FROM snapshot_objects) AS objects, (SELECT COUNT(*) FROM snapshot_object_chunks) AS chunks",
        )
        .first();
      expect(counts).toStrictEqual({ objects: 0, chunks: 0 });
    } finally {
      await store.database.prepare("DROP TRIGGER refuse_latest").run();
    }
  });
});
