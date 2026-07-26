import {
  asObjectRecord,
  rejectUnknownKeys,
  requireTimestamp,
} from "./ingestion-field-parsers";
import {
  parseIngestionEvent,
  parseIngestionEventForTopic,
} from "./ingestion-event-parser";
import type { IngestionEvent, IngestionTopicContract } from "./ingestion-types";

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

function readSnapshotRecordEnvelope(value: unknown) {
  const record = asObjectRecord(value, RECORD_CONTEXT);
  rejectUnknownKeys(record, ["receivedAt", "event"], RECORD_CONTEXT);
  return {
    receivedAt: requireTimestamp(record, "receivedAt", RECORD_CONTEXT),
    storedEvent: record["event"],
  };
}

export function parseIngestedSnapshotRecord(
  value: unknown,
): IngestedSnapshotRecord<unknown> {
  const { receivedAt, storedEvent } = readSnapshotRecordEnvelope(value);
  return { receivedAt, event: parseIngestionEvent(storedEvent) };
}

export function parseIngestedSnapshotRecordForTopic<Payload>(
  contract: IngestionTopicContract<Payload>,
  value: unknown,
): IngestedSnapshotRecord<Payload> {
  const { receivedAt, storedEvent } = readSnapshotRecordEnvelope(value);
  return {
    receivedAt,
    event: parseIngestionEventForTopic(contract, storedEvent),
  };
}
