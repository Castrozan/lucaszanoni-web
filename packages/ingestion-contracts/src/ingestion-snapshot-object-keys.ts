import {
  TIMESTAMP_WITH_TIMEZONE_PATTERN,
  URL_SAFE_LABEL_PATTERN,
} from "./ingestion-field-parsers";
import { IngestionContractViolationError } from "./ingestion-types";

export const SNAPSHOT_OBJECT_KEY_ROOT = "snapshots";

const EVENT_IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;

function requireTopicLabel(topic: string): string {
  if (!URL_SAFE_LABEL_PATTERN.test(topic)) {
    throw new IngestionContractViolationError(
      `topic ${topic} cannot address a snapshot object because it is not a url safe label`,
    );
  }
  return topic;
}

function requireProducedAtStamp(producedAt: string): string {
  if (
    !TIMESTAMP_WITH_TIMEZONE_PATTERN.test(producedAt) ||
    Number.isNaN(Date.parse(producedAt))
  ) {
    throw new IngestionContractViolationError(
      `produced at stamp ${producedAt} cannot address a snapshot object because it is not an iso 8601 timestamp`,
    );
  }
  return producedAt;
}

function requireEventIdentifier(eventIdentifier: string): string {
  if (!EVENT_IDENTIFIER_PATTERN.test(eventIdentifier)) {
    throw new IngestionContractViolationError(
      `event identifier ${eventIdentifier} cannot address a snapshot object because it is not an alphanumeric identifier`,
    );
  }
  return eventIdentifier;
}

export function buildTopicSnapshotPrefix(topic: string): string {
  return `${SNAPSHOT_OBJECT_KEY_ROOT}/${requireTopicLabel(topic)}`;
}

export function buildLatestSnapshotObjectKey(topic: string): string {
  return `${buildTopicSnapshotPrefix(topic)}/latest.json`;
}

export function buildSnapshotEventObjectKey(
  topic: string,
  producedAt: string,
  eventIdentifier: string,
): string {
  const prefix = buildTopicSnapshotPrefix(topic);
  const stamp = requireProducedAtStamp(producedAt);
  const identifier = requireEventIdentifier(eventIdentifier);
  return `${prefix}/events/${stamp}-${identifier}.json`;
}
