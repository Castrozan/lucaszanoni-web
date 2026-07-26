import {
  asObjectRecord,
  rejectUnknownKeys,
  requireTimestamp,
} from "./ingestion-field-parsers";
import { parseIngestionEvent } from "./ingestion-event-parser";
import type { IngestionEvent } from "./ingestion-types";

const RECORD_CONTEXT = "ingested snapshot record";

export interface IngestedSnapshotRecord<Payload = unknown> {
  readonly receivedAt: string;
  readonly event: IngestionEvent<Payload>;
}

export function buildIngestedSnapshotRecord<Payload>(
  event: IngestionEvent<Payload>,
  receivedAt: string,
): IngestedSnapshotRecord<Payload> {
  return { receivedAt, event };
}

export function parseIngestedSnapshotRecord(
  value: unknown,
): IngestedSnapshotRecord<unknown> {
  const record = asObjectRecord(value, RECORD_CONTEXT);
  rejectUnknownKeys(record, ["receivedAt", "event"], RECORD_CONTEXT);
  return {
    receivedAt: requireTimestamp(record, "receivedAt", RECORD_CONTEXT),
    event: parseIngestionEvent(record["event"]),
  };
}
