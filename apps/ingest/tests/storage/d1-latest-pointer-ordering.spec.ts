import fc from "fast-check";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createD1SnapshotObjectReader } from "../../src/storage/d1-snapshot-object-reader";
import { createD1SnapshotObjectWriter } from "../../src/storage/d1-snapshot-object-writer";
import { openLocalD1Store, type LocalD1Store } from "./local-d1-store";
import {
  eventKeyFor,
  latestRecordProducedAt,
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

describe("ordering the latest pointer by instant", () => {
  it("does not let an older instant regress latest even when its text sorts later", async () => {
    const writer = createD1SnapshotObjectWriter(store.database);
    const newerInstant = "2026-07-24T12:00:00.000Z";
    const olderInstantSortingLater = "2026-07-24T14:00:00.000+05:00";
    await writer.writeSnapshot({
      eventObjectKey: eventKeyFor(newerInstant),
      record: recordProducedAt(newerInstant),
    });
    await writer.writeSnapshot({
      eventObjectKey: eventKeyFor(olderInstantSortingLater),
      record: recordProducedAt(olderInstantSortingLater),
    });
    expect(await latestRecordProducedAt(store.database)).toBe(newerInstant);
    const older = await createD1SnapshotObjectReader(
      store.database,
    ).readSnapshotObject(eventKeyFor(olderInstantSortingLater));
    expect(older).not.toBeNull();
  });

  it("lands on the latest instant for every arrival order", async () => {
    const offsetStamps = fc.uniqueArray(
      fc.record({
        epochMilliseconds: fc.integer({
          min: 1_700_000_000_000,
          max: 1_900_000_000_000,
        }),
        offsetMinutes: fc.constantFrom(-180, 0, 330, 540),
      }),
      {
        minLength: 2,
        maxLength: 6,
        selector: (stamp) => stamp.epochMilliseconds,
      },
    );
    await fc.assert(
      fc.asyncProperty(offsetStamps, fc.nat(), async (stamps, shuffleSeed) => {
        await store.clear();
        const writer = createD1SnapshotObjectWriter(store.database);
        const rendered = stamps.map(({ epochMilliseconds, offsetMinutes }) => {
          const shifted = new Date(epochMilliseconds + offsetMinutes * 60_000);
          const sign = offsetMinutes < 0 ? "-" : "+";
          const absolute = Math.abs(offsetMinutes);
          const offsetText = `${sign}${String(Math.floor(absolute / 60)).padStart(2, "0")}:${String(absolute % 60).padStart(2, "0")}`;
          return {
            epochMilliseconds,
            producedAt: `${shifted.toISOString().slice(0, -1)}${offsetText}`,
          };
        });
        const arrivalOrder = [...rendered].sort(
          (left, right) =>
            ((left.epochMilliseconds * 31 + shuffleSeed) % 97) -
            ((right.epochMilliseconds * 31 + shuffleSeed) % 97),
        );
        for (const { producedAt } of arrivalOrder) {
          await writer.writeSnapshot({
            eventObjectKey: eventKeyFor(producedAt),
            record: recordProducedAt(producedAt),
          });
        }
        const newest = rendered.reduce((best, candidate) =>
          candidate.epochMilliseconds > best.epochMilliseconds
            ? candidate
            : best,
        );
        expect(await latestRecordProducedAt(store.database)).toBe(
          newest.producedAt,
        );
      }),
      { numRuns: 25 },
    );
  }, 15_000);

  it("breaks an equal-instant tie by key so arrival order cannot matter", async () => {
    const writer = createD1SnapshotObjectWriter(store.database);
    const zulu = "2026-07-24T12:00:00.000Z";
    const offset = "2026-07-24T09:00:00.000-03:00";
    for (const stamp of [offset, zulu]) {
      await writer.writeSnapshot({
        eventObjectKey: eventKeyFor(stamp),
        record: recordProducedAt(stamp),
      });
    }
    const winnerKey = [eventKeyFor(offset), eventKeyFor(zulu)].sort().at(-1);
    const row = await store.database
      .prepare("SELECT event_object_key FROM snapshot_latest")
      .first<{ event_object_key: string }>();
    expect(row?.event_object_key).toBe(winnerKey);
  });
});
