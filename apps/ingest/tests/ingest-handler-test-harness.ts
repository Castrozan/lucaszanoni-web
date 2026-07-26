import { createIngestRequestHandler } from "../src/ingest-request-handler";
import {
  createRecordingSnapshotObjectWriter,
  testBaselineEventFixture,
} from "./ingest-test-fixtures";

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
  const handleIngestRequest = createIngestRequestHandler({
    mountPath: "/ingest/",
    configuredProducerSecret,
    snapshotObjectWriter,
    readCurrentTimestamp: () => receivedAt,
    ...overrides,
  });
  return { handleIngestRequest, snapshotObjectWriter };
}

export function buildAuthorizedPost(
  body: unknown = testBaselineEventFixture,
  pathname = topicPath,
) {
  return {
    method: "POST",
    pathname,
    presentedProducerSecret: configuredProducerSecret,
    body: JSON.stringify(body),
  };
}
