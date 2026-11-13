import { createIngestRequestHandler } from "../src/ingest-request-handler";
import {
  createRecordingArtifactObjectWriter,
  createRecordingSnapshotObjectWriter,
} from "./ingest-test-doubles";
import { testBaselineEventFixture } from "./ingest-test-fixtures";

export const configuredProducerSecret = "producer-secret-value";
export const receivedAt = "2026-07-24T03:26:30.000Z";
export const topicPath = "/ingest/dotfiles-test-baseline";
export const expectedEventObjectKey =
  "snapshots/dotfiles-test-baseline/events/2026-07-24T03:26:24.774Z-5667c9f6.json";
export const expectedLatestObjectKey =
  "snapshots/dotfiles-test-baseline/latest.json";

export function createHandlerUnderTest(
  overrides: Partial<Parameters<typeof createIngestRequestHandler>[0]> = {},
) {
  const snapshotObjectWriter = createRecordingSnapshotObjectWriter();
  const artifactObjectWriter = createRecordingArtifactObjectWriter();
  const handleIngestRequest = createIngestRequestHandler({
    mountPath: "/ingest/",
    configuredProducerSecret,
    snapshotObjectWriter,
    artifactObjectWriter,
    readCurrentTimestamp: () => receivedAt,
    ...overrides,
  });
  return { handleIngestRequest, snapshotObjectWriter, artifactObjectWriter };
}

export function buildAuthorizedPost(
  body: unknown = testBaselineEventFixture,
  pathname = topicPath,
) {
  return {
    method: "POST",
    pathname,
    presentedProducerSecret: configuredProducerSecret,
    contentType: "application/json",
    body: new TextEncoder().encode(
      typeof body === "string" ? body : JSON.stringify(body),
    ),
  };
}

export function buildAuthorizedArtifactPut(
  objectKey: string,
  body: string | Uint8Array,
  contentType: string | null = "application/json",
) {
  return {
    method: "PUT",
    pathname: `/ingest/artifacts/${encodeURIComponent(objectKey)}`,
    presentedProducerSecret: configuredProducerSecret,
    contentType: contentType ?? undefined,
    body: typeof body === "string" ? new TextEncoder().encode(body) : body,
  };
}
