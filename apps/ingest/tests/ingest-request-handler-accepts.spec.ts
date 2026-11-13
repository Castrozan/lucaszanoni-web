import { describe, expect, it } from "vitest";
import {
  buildAuthorizedPost,
  createHandlerUnderTest,
  expectedEventObjectKey,
  expectedLatestObjectKey,
  receivedAt,
} from "./ingest-handler-test-harness";
import { testBaselineEventFixture } from "./ingest-test-fixtures";

describe("accepting a contracted ingest request", () => {
  it("answers the health probe without a producer secret", async () => {
    const { handleIngestRequest } = createHandlerUnderTest();
    const response = await handleIngestRequest({
      method: "GET",
      pathname: "/livez",
      presentedProducerSecret: undefined,
      contentType: undefined,
      body: new Uint8Array(0),
    });
    expect(response.statusCode).toBe(200);
  });

  it("accepts a contracted event and reports where it stored it", async () => {
    const { handleIngestRequest } = createHandlerUnderTest();
    const response = await handleIngestRequest(buildAuthorizedPost());
    expect(response.statusCode).toBe(202);
    expect(response.body).toStrictEqual({
      topic: "dotfiles-test-baseline",
      schemaVersion: 1,
      eventObjectKey: expectedEventObjectKey,
      latestObjectKey: expectedLatestObjectKey,
    });
  });

  it("hands the writer one write carrying the event key and the received record", async () => {
    const { handleIngestRequest, snapshotObjectWriter } =
      createHandlerUnderTest();
    await handleIngestRequest(buildAuthorizedPost());
    expect(snapshotObjectWriter.writes).toStrictEqual([
      {
        eventObjectKey: expectedEventObjectKey,
        record: { receivedAt, event: testBaselineEventFixture },
      },
    ]);
  });

  it("maps the mounted health path to the health probe", async () => {
    const { handleIngestRequest } = createHandlerUnderTest();
    const response = await handleIngestRequest({
      method: "GET",
      pathname: "/ingest/livez",
      presentedProducerSecret: undefined,
      contentType: undefined,
      body: new Uint8Array(0),
    });
    expect(response.statusCode).toBe(200);
  });

  it("names the event object after the producer when the event carries no commit", async () => {
    const { handleIngestRequest, snapshotObjectWriter } =
      createHandlerUnderTest();
    const { source: _discardedSource, ...eventWithoutSource } =
      testBaselineEventFixture;
    await handleIngestRequest(buildAuthorizedPost(eventWithoutSource));
    expect(
      snapshotObjectWriter.writes.map((write) => write.eventObjectKey),
    ).toStrictEqual([
      "snapshots/dotfiles-test-baseline/events/2026-07-24T03:26:24.774Z-dotfiles-github-actions.json",
    ]);
  });
});
