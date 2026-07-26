import { describe, expect, it } from "vitest";
import {
  buildAuthorizedPost,
  createHandlerUnderTest,
} from "./ingest-handler-test-harness";
import {
  createFailingSnapshotObjectWriter,
  testBaselineEventFixture,
} from "./ingest-test-fixtures";

describe("refusing an ingest request", () => {
  it("rejects a wrong producer secret and stores nothing", async () => {
    const { handleIngestRequest, snapshotObjectWriter } =
      createHandlerUnderTest();
    const response = await handleIngestRequest({
      ...buildAuthorizedPost(),
      presentedProducerSecret: "wrong-secret-value",
    });
    expect(response.statusCode).toBe(401);
    expect(snapshotObjectWriter.writtenObjects.size).toBe(0);
  });

  it("rejects a missing producer secret", async () => {
    const { handleIngestRequest } = createHandlerUnderTest();
    const response = await handleIngestRequest({
      ...buildAuthorizedPost(),
      presentedProducerSecret: undefined,
    });
    expect(response.statusCode).toBe(401);
  });

  it("refuses to serve at all when no producer secret is configured", async () => {
    const { handleIngestRequest } = createHandlerUnderTest({
      configuredProducerSecret: undefined,
    });
    const response = await handleIngestRequest(buildAuthorizedPost());
    expect(response.statusCode).toBe(503);
  });

  it("authorizes before revealing whether a topic is registered", async () => {
    const { handleIngestRequest } = createHandlerUnderTest();
    const response = await handleIngestRequest({
      ...buildAuthorizedPost(testBaselineEventFixture, "/ingest/no-such-topic"),
      presentedProducerSecret: "wrong-secret-value",
    });
    expect(response.statusCode).toBe(401);
  });

  it("rejects an unregistered topic", async () => {
    const { handleIngestRequest } = createHandlerUnderTest();
    const response = await handleIngestRequest(
      buildAuthorizedPost(testBaselineEventFixture, "/ingest/no-such-topic"),
    );
    expect(response.statusCode).toBe(404);
  });

  it("rejects a body that is not json", async () => {
    const { handleIngestRequest } = createHandlerUnderTest();
    const response = await handleIngestRequest({
      ...buildAuthorizedPost(),
      body: "{not json",
    });
    expect(response.statusCode).toBe(400);
  });

  it("rejects an event whose topic disagrees with the path it was posted to", async () => {
    const { handleIngestRequest, snapshotObjectWriter } =
      createHandlerUnderTest();
    const response = await handleIngestRequest(
      buildAuthorizedPost({
        ...testBaselineEventFixture,
        topic: "claude-usage-daily",
      }),
    );
    expect(response.statusCode).toBe(400);
    expect(response.body["error"]).toMatch(/does not match the contract/);
    expect(snapshotObjectWriter.writtenObjects.size).toBe(0);
  });

  it("rejects a payload that violates its topic contract and stores nothing", async () => {
    const { handleIngestRequest, snapshotObjectWriter } =
      createHandlerUnderTest();
    const response = await handleIngestRequest(
      buildAuthorizedPost({
        ...testBaselineEventFixture,
        payload: { ...testBaselineEventFixture.payload, passedTests: 4 },
      }),
    );
    expect(response.statusCode).toBe(400);
    expect(response.body["error"]).toMatch(/passedTests/);
    expect(snapshotObjectWriter.writtenObjects.size).toBe(0);
  });

  it("rejects an unknown path", async () => {
    const { handleIngestRequest } = createHandlerUnderTest();
    const response = await handleIngestRequest(
      buildAuthorizedPost(testBaselineEventFixture, "/engineering/reports/"),
    );
    expect(response.statusCode).toBe(404);
  });

  it("rejects a read of the topic path", async () => {
    const { handleIngestRequest } = createHandlerUnderTest();
    const response = await handleIngestRequest({
      ...buildAuthorizedPost(),
      method: "GET",
    });
    expect(response.statusCode).toBe(405);
  });

  it("reports a storage failure as a gateway failure rather than a contract failure", async () => {
    const { handleIngestRequest } = createHandlerUnderTest({
      snapshotObjectWriter: createFailingSnapshotObjectWriter(
        "bucket refused the write",
      ),
    });
    const response = await handleIngestRequest(buildAuthorizedPost());
    expect(response.statusCode).toBe(502);
  });
});
