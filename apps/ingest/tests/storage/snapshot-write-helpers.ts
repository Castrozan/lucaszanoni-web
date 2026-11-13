import type { IngestedSnapshotRecord } from "@platform/ingestion-contracts";
import { createD1SnapshotObjectReader } from "../../src/storage/d1-snapshot-object-reader";
import type { SnapshotDatabase } from "../../src/storage/snapshot-database";
import { testBaselineEventFixture } from "../ingest-test-fixtures";

export const baselineTopic = "dotfiles-test-baseline";
export const baselineLatestKey = `snapshots/${baselineTopic}/latest.json`;
export const receivedAt = "2026-07-24T03:26:30.000Z";

export function recordProducedAt(producedAt: string): IngestedSnapshotRecord {
  return {
    receivedAt,
    event: { ...testBaselineEventFixture, producedAt },
  } as unknown as IngestedSnapshotRecord;
}

export function eventKeyFor(producedAt: string): string {
  return `snapshots/${baselineTopic}/events/${producedAt}-5667c9f6.json`;
}

export async function latestRecordProducedAt(
  database: SnapshotDatabase,
): Promise<string | undefined> {
  const stored =
    await createD1SnapshotObjectReader(database).readSnapshotObject(
      baselineLatestKey,
    );
  return stored === null
    ? undefined
    : JSON.parse(new TextDecoder().decode(stored.body)).event.producedAt;
}
