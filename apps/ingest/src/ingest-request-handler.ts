import {
  IngestionContractViolationError,
  buildIngestedSnapshotRecord,
  buildLatestSnapshotObjectKey,
  buildSnapshotEventObjectKey,
  findIngestionTopicContract,
  parseIngestionEventForTopic,
  type IngestedSnapshotRecord,
  type IngestionTopicContract,
} from "@platform/ingestion-contracts";
import { presentedProducerSecretMatches } from "./ingest-producer-authorization";
import { resolveIngestRequestTarget } from "./ingest-request-target";
import type { SnapshotObjectWriter } from "./snapshot-object-writer";

export interface IngestRequest {
  readonly method: string;
  readonly pathname: string;
  readonly presentedProducerSecret: string | undefined;
  readonly body: string;
}

export interface IngestResponse {
  readonly statusCode: number;
  readonly body: Readonly<Record<string, unknown>>;
}

export interface IngestRequestHandlerDependencies {
  readonly mountPath: string;
  readonly configuredProducerSecret: string | undefined;
  readonly snapshotObjectWriter: SnapshotObjectWriter;
  readonly readCurrentTimestamp: () => string;
}

interface PreparedSnapshotWrite {
  readonly record: IngestedSnapshotRecord;
  readonly eventObjectKey: string;
  readonly latestObjectKey: string;
  readonly schemaVersion: number;
}

function refuse(statusCode: number, error: string): IngestResponse {
  return { statusCode, body: { error } };
}

function parseRequestBodyAsJson(body: string): unknown {
  try {
    return JSON.parse(body);
  } catch {
    throw new IngestionContractViolationError(
      "the request body is not valid json",
    );
  }
}

function prepareSnapshotWrite(
  contract: IngestionTopicContract<unknown>,
  requestBody: string,
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

async function storeSnapshotUnderTopic(
  dependencies: IngestRequestHandlerDependencies,
  topic: string,
  requestBody: string,
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

  const objectBody = JSON.stringify(prepared.record);
  try {
    await dependencies.snapshotObjectWriter.writeSnapshotObject(
      prepared.eventObjectKey,
      objectBody,
    );
    await dependencies.snapshotObjectWriter.writeSnapshotObject(
      prepared.latestObjectKey,
      objectBody,
    );
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

function authorizeProducer(
  dependencies: IngestRequestHandlerDependencies,
  presentedProducerSecret: string | undefined,
): IngestResponse | undefined {
  if (
    dependencies.configuredProducerSecret === undefined ||
    dependencies.configuredProducerSecret === ""
  ) {
    return refuse(
      503,
      "ingest is not accepting events because no producer secret is configured",
    );
  }
  if (
    !presentedProducerSecretMatches(
      presentedProducerSecret,
      dependencies.configuredProducerSecret,
    )
  ) {
    return refuse(401, "the presented producer secret is not accepted");
  }
  return undefined;
}

export function createIngestRequestHandler(
  dependencies: IngestRequestHandlerDependencies,
): (request: IngestRequest) => Promise<IngestResponse> {
  return async function handleIngestRequest(request) {
    const target = resolveIngestRequestTarget(
      dependencies.mountPath,
      request.method,
      request.pathname,
    );

    if (target.kind === "health") {
      return { statusCode: 200, body: { status: "ok" } };
    }
    if (target.kind === "not-found") {
      return refuse(404, `${request.pathname} is not an ingest endpoint`);
    }
    if (target.kind === "method-not-allowed") {
      return refuse(
        405,
        `${request.method} is not accepted at ${request.pathname}`,
      );
    }

    const refusal = authorizeProducer(
      dependencies,
      request.presentedProducerSecret,
    );
    return (
      refusal ??
      storeSnapshotUnderTopic(dependencies, target.topic, request.body)
    );
  };
}
