import {
  ingestArtifact,
  type ArtifactIngestionDependencies,
} from "./artifact-ingestion";
import { refuseUnauthorizedProducer } from "./ingest-producer-gate";
import {
  refuse,
  type IngestRequest,
  type IngestResponse,
} from "./ingest-response";
import { resolveIngestRequestTarget } from "./ingest-request-target";
import {
  ingestTopicSnapshot,
  type TopicSnapshotIngestionDependencies,
} from "./topic-snapshot-ingestion";

export type { IngestRequest, IngestResponse } from "./ingest-response";

export interface IngestRequestHandlerDependencies
  extends TopicSnapshotIngestionDependencies, ArtifactIngestionDependencies {
  readonly mountPath: string;
  readonly configuredProducerSecret: string | undefined;
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

    const refusal = refuseUnauthorizedProducer(
      dependencies.configuredProducerSecret,
      request.presentedProducerSecret,
    );
    if (refusal !== undefined) {
      return refusal;
    }
    return target.kind === "artifact"
      ? ingestArtifact(
          dependencies,
          target.objectKey,
          request.contentType,
          request.body,
        )
      : ingestTopicSnapshot(dependencies, target.topic, request.body);
  };
}
