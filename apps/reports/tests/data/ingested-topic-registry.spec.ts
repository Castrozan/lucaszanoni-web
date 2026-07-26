import { describe, expect, it } from "vitest";
import { INGESTION_TOPIC_CONTRACTS } from "@platform/ingestion-contracts";
import { REGISTERED_INGESTION_TOPICS } from "../../src/data/ingested-topic-registry";

describe("REGISTERED_INGESTION_TOPICS", () => {
  it("carries one entry per contract the ingestion package registers", () => {
    expect(
      REGISTERED_INGESTION_TOPICS.map((entry) => entry.contract.topic),
    ).toEqual(INGESTION_TOPIC_CONTRACTS.map((contract) => contract.topic));
  });

  it("reads every topic from its own contracted latest snapshot key", () => {
    for (const entry of REGISTERED_INGESTION_TOPICS) {
      expect(entry.source.snapshotUrl).toBe(
        `https://storage.googleapis.com/zg-url-shortener-2026-dotfiles-usage-snapshots/snapshots/${entry.contract.topic}/latest.json`,
      );
    }
  });

  it("registers no topic twice, so no number can arrive from two sources", () => {
    const topics = REGISTERED_INGESTION_TOPICS.map(
      (entry) => entry.contract.topic,
    );
    expect(new Set(topics).size).toBe(topics.length);
  });

  it("gives every registered topic a positive contract version", () => {
    for (const entry of REGISTERED_INGESTION_TOPICS) {
      expect(entry.contract.schemaVersion).toBeGreaterThan(0);
    }
  });
});
