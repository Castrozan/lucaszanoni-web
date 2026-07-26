import { describe, expect, it } from "vitest";
import {
  IngestionContractViolationError,
  type IngestionTopicContract,
} from "@platform/ingestion-contracts";
import { createIngestedSnapshotSource } from "../../src/data/ingested-snapshot-source";

interface CountedPayload {
  readonly count: number;
}

function parseCountedPayload(value: unknown): CountedPayload {
  const record = value as Partial<CountedPayload>;
  if (typeof record?.count !== "number") {
    throw new IngestionContractViolationError("count must be a number");
  }
  return { count: record.count };
}

const countedContract: IngestionTopicContract<CountedPayload> = {
  topic: "counted-topic",
  schemaVersion: 1,
  description: "a stand in topic that only carries a count",
  payloadSchema: { type: "object" },
  parsePayload: parseCountedPayload,
};

const countedSource = createIngestedSnapshotSource(countedContract);

const ingestedRecord = {
  receivedAt: "2026-07-24T03:26:30.000Z",
  event: {
    topic: "counted-topic",
    schemaVersion: 1,
    producedAt: "2026-07-24T03:26:24.774Z",
    producer: "a-producer",
    payload: { count: 4 },
  },
};

function recordWithEventOverrides(overrides: Record<string, unknown>) {
  return {
    ...ingestedRecord,
    event: { ...ingestedRecord.event, ...overrides },
  };
}

describe("the shared ingested snapshot source", () => {
  it("reads the contracted latest object of the topic it was built for", () => {
    expect(countedSource.snapshotUrl).toBe(
      "https://storage.googleapis.com/zg-url-shortener-2026-dotfiles-usage-snapshots/snapshots/counted-topic/latest.json",
    );
  });

  it("carries both stamps and the parsed payload of a contracted record", () => {
    const snapshot = countedSource.readSnapshot(ingestedRecord);

    expect(snapshot?.receivedAt).toBe("2026-07-24T03:26:30.000Z");
    expect(snapshot?.producedAt).toBe("2026-07-24T03:26:24.774Z");
    expect(snapshot?.payload.count).toBe(4);
  });

  it("refuses a record its own payload parser rejects", () => {
    const unparseablePayload = recordWithEventOverrides({
      payload: { count: "four" },
    });

    expect(countedSource.readSnapshot(unparseablePayload)).toBeNull();
  });

  it("refuses a record carrying a key the envelope never declared", () => {
    expect(
      countedSource.readSnapshot(recordWithEventOverrides({ retries: 2 })),
    ).toBeNull();
  });

  it("refuses a record ingested under a different topic", () => {
    const otherTopic = recordWithEventOverrides({ topic: "another-topic" });

    expect(countedSource.readSnapshot(otherTopic)).toBeNull();
  });

  it("refuses anything that is not an ingested record at all", () => {
    expect(countedSource.readSnapshot(null)).toBeNull();
    expect(countedSource.readSnapshot("latest.json")).toBeNull();
  });
});
