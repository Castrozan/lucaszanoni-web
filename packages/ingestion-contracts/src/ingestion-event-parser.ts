import {
  asObjectRecord,
  optionalHttpsUrl,
  optionalString,
  rejectUnknownKeys,
  requirePositiveInteger,
  requireTimestamp,
  requireUrlSafeLabel,
} from "./ingestion-field-parsers";
import { requireIngestionTopicContract } from "./ingestion-topic-registry";
import {
  IngestionContractViolationError,
  type IngestionEvent,
  type IngestionEventSource,
  type IngestionTopicContract,
} from "./ingestion-types";

const EVENT_CONTEXT = "ingestion event";

const ENVELOPE_KEYS = [
  "topic",
  "schemaVersion",
  "producedAt",
  "producer",
  "source",
  "payload",
] as const;

function parseEventSource(value: unknown): IngestionEventSource | undefined {
  if (value === undefined) {
    return undefined;
  }
  const context = `${EVENT_CONTEXT} source`;
  const record = asObjectRecord(value, context);
  rejectUnknownKeys(record, ["repository", "commit", "runUrl"], context);
  return {
    repository: optionalString(record, "repository", context),
    commit: optionalString(record, "commit", context),
    runUrl: optionalHttpsUrl(record, "runUrl", context),
  };
}

export function parseIngestionEventForTopic<Payload>(
  contract: IngestionTopicContract<Payload>,
  value: unknown,
): IngestionEvent<Payload> {
  const record = asObjectRecord(value, EVENT_CONTEXT);
  rejectUnknownKeys(record, ENVELOPE_KEYS, EVENT_CONTEXT);

  const topic = requireUrlSafeLabel(record, "topic", EVENT_CONTEXT);
  if (topic !== contract.topic) {
    throw new IngestionContractViolationError(
      `${EVENT_CONTEXT} field topic ${topic} does not match the contract for ${contract.topic}`,
    );
  }

  const schemaVersion = requirePositiveInteger(
    record,
    "schemaVersion",
    EVENT_CONTEXT,
  );
  if (schemaVersion !== contract.schemaVersion) {
    throw new IngestionContractViolationError(
      `${EVENT_CONTEXT} field schemaVersion ${schemaVersion} is not served by topic ${contract.topic} which is at version ${contract.schemaVersion}`,
    );
  }

  const producedAt = requireTimestamp(record, "producedAt", EVENT_CONTEXT);
  const producer = requireUrlSafeLabel(record, "producer", EVENT_CONTEXT);
  const source = parseEventSource(record["source"]);
  const payload = contract.parsePayload(record["payload"]);

  return source === undefined
    ? { topic, schemaVersion, producedAt, producer, payload }
    : { topic, schemaVersion, producedAt, producer, source, payload };
}

export function parseIngestionEvent(value: unknown): IngestionEvent<unknown> {
  const record = asObjectRecord(value, EVENT_CONTEXT);
  rejectUnknownKeys(record, ENVELOPE_KEYS, EVENT_CONTEXT);
  const topic = requireUrlSafeLabel(record, "topic", EVENT_CONTEXT);
  return parseIngestionEventForTopic(
    requireIngestionTopicContract(topic),
    record,
  );
}
