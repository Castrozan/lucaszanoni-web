import { parseIngestedSnapshotRecord } from "@platform/ingestion-contracts";
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
      body: "",
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

  it("stores the accepted event under both the event key and the latest key", async () => {
    const { handleIngestRequest, snapshotObjectWriter } =
      createHandlerUnderTest();
    await handleIngestRequest(buildAuthorizedPost());
    expect(
      [...snapshotObjectWriter.writtenObjects.keys()].sort(),
    ).toStrictEqual([expectedEventObjectKey, expectedLatestObjectKey].sort());
    expect(
      snapshotObjectWriter.writtenObjects.get(expectedEventObjectKey),
    ).toBe(snapshotObjectWriter.writtenObjects.get(expectedLatestObjectKey));
  });

  it("stores a snapshot record the contracts package can read back", async () => {
    const { handleIngestRequest, snapshotObjectWriter } =
      createHandlerUnderTest();
    await handleIngestRequest(buildAuthorizedPost());
    const storedBody = snapshotObjectWriter.writtenObjects.get(
      expectedLatestObjectKey,
    );
    const record = parseIngestedSnapshotRecord(JSON.parse(storedBody ?? ""));
    expect(record.receivedAt).toBe(receivedAt);
    expect(record.event).toStrictEqual(testBaselineEventFixture);
  });

  it("names the event object after the producer when the event carries no commit", async () => {
    const { handleIngestRequest, snapshotObjectWriter } =
      createHandlerUnderTest();
    const { source: _discardedSource, ...eventWithoutSource } =
      testBaselineEventFixture;
    await handleIngestRequest(buildAuthorizedPost(eventWithoutSource));
    expect([...snapshotObjectWriter.writtenObjects.keys()]).toContain(
      "snapshots/dotfiles-test-baseline/events/2026-07-24T03:26:24.774Z-dotfiles-github-actions.json",
    );
  });
});
