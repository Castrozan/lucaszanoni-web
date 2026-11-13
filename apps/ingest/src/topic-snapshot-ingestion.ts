import {
  IngestionContractViolationError,
  buildIngestedSnapshotRecord,
  buildLatestSnapshotObjectKey,
  buildSnapshotEventObjectKey,
  findIngestionTopicContract,
  parseIngestionEventForTopic,
  type IngestionTopicContract,
} from "@platform/ingestion-contracts";
import { refuse, type IngestResponse } from "./ingest-response";
import { decodeStrictUtf8 } from "./strict-utf8";
import type {
  SnapshotObjectWriter,
  SnapshotWrite,
} from "./snapshot-object-writer";

export interface TopicSnapshotIngestionDependencies {
  readonly snapshotObjectWriter: SnapshotObjectWriter;
  readonly readCurrentTimestamp: () => string;
}

interface PreparedSnapshotWrite extends SnapshotWrite {
  readonly latestObjectKey: string;
  readonly schemaVersion: number;
}

function parseRequestBodyAsJson(body: Uint8Array): unknown {
  const text = decodeStrictUtf8(body);
  try {
    if (text === undefined) {
      throw new Error("not utf-8");
    }
    return JSON.parse(text);
  } catch {
    throw new IngestionContractViolationError(
      "the request body is not valid utf-8 json",
    );
  }
}

function prepareSnapshotWrite(
  contract: IngestionTopicContract<unknown>,
  requestBody: Uint8Array,
  receivedAt: string,
): PreparedSnapshotWrite {
  const event = parseIngestionEventForTopic(
    contract,
    parseRequestBodyAsJson(requestBody),
  );
  const eventIdentifier = event.source?.commit ?? event.producer;
  return {
    record: buildIngestedSnapshotRecord(event, receivedAt),
    eventObjectKey: buildSnapshotEventObjectKey(
      event.topic,
      event.producedAt,
      eventIdentifier,
    ),
    latestObjectKey: buildLatestSnapshotObjectKey(event.topic),
    schemaVersion: event.schemaVersion,
  };
}

export async function ingestTopicSnapshot(
  dependencies: TopicSnapshotIngestionDependencies,
  topic: string,
  requestBody: Uint8Array,
): Promise<IngestResponse> {
  const contract = findIngestionTopicContract(topic);
  if (contract === undefined) {
    return refuse(
      404,
      `topic ${topic} is not registered so nothing may be ingested under it`,
    );
  }

  let prepared: PreparedSnapshotWrite;
  try {
    prepared = prepareSnapshotWrite(
      contract,
      requestBody,
      dependencies.readCurrentTimestamp(),
    );
  } catch (violation) {
    if (violation instanceof IngestionContractViolationError) {
      return refuse(400, violation.message);
    }
    throw violation;
  }

  try {
    await dependencies.snapshotObjectWriter.writeSnapshot({
      eventObjectKey: prepared.eventObjectKey,
      record: prepared.record,
    });
  } catch (writeFailure) {
    return refuse(
      502,
      `the snapshot store refused the write: ${String(writeFailure)}`,
    );
  }

  return {
    statusCode: 202,
    body: {
      topic,
      schemaVersion: prepared.schemaVersion,
      eventObjectKey: prepared.eventObjectKey,
      latestObjectKey: prepared.latestObjectKey,
    },
  };
}
