import { describe, expect, it } from "vitest";
import {
  INGESTION_TOPIC_CONTRACTS,
  findIngestionTopicContract,
  requireIngestionTopicContract,
} from "../src/ingestion-topic-registry";
import { IngestionContractViolationError } from "../src/ingestion-types";

describe("the ingestion topic registry", () => {
  it("registers at least the dotfiles test baseline topic", () => {
    expect(findIngestionTopicContract("dotfiles-test-baseline")).toBeDefined();
  });

  it("returns undefined for an unregistered topic", () => {
    expect(
      findIngestionTopicContract("nothing-publishes-here"),
    ).toBeUndefined();
  });

  it("throws for an unregistered topic when one is required", () => {
    expect(() =>
      requireIngestionTopicContract("nothing-publishes-here"),
    ).toThrow(IngestionContractViolationError);
  });

  it("exposes every topic under a url and object key safe label", () => {
    for (const contract of INGESTION_TOPIC_CONTRACTS) {
      expect(contract.topic).toMatch(/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/);
    }
  });

  it("has no duplicate topic", () => {
    const topics = INGESTION_TOPIC_CONTRACTS.map((contract) => contract.topic);
    expect(new Set(topics).size).toBe(topics.length);
  });

  it("serves a positive integer schema version for every topic", () => {
    for (const contract of INGESTION_TOPIC_CONTRACTS) {
      expect(Number.isInteger(contract.schemaVersion)).toBe(true);
      expect(contract.schemaVersion).toBeGreaterThan(0);
    }
  });

  it("describes every topic so the ingestion surface is self documenting", () => {
    for (const contract of INGESTION_TOPIC_CONTRACTS) {
      expect(contract.description.length).toBeGreaterThan(0);
    }
  });

  it("binds a payload schema to every topic", () => {
    for (const contract of INGESTION_TOPIC_CONTRACTS) {
      expect(contract.payloadSchema["additionalProperties"]).toBe(false);
    }
  });
});
