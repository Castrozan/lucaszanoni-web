import { describe, expect, it } from "vitest";
import { parseIngestionEvent } from "../src/ingestion-event-parser";
import { IngestionContractViolationError } from "../src/ingestion-types";
import { testBaselineEventFixture } from "./ingestion-test-fixtures";

describe("parseIngestionEvent", () => {
  const validEvent = testBaselineEventFixture;

  it("accepts a well formed event on a registered topic", () => {
    const event = parseIngestionEvent(validEvent);
    expect(event.topic).toBe("dotfiles-test-baseline");
    expect(event.schemaVersion).toBe(1);
    expect(event.producer).toBe("dotfiles-github-actions");
  });

  it("accepts an event without the optional source block", () => {
    const { source: _omitted, ...withoutSource } = validEvent;
    expect(() => parseIngestionEvent(withoutSource)).not.toThrow();
  });

  it("rejects a non object document", () => {
    expect(() => parseIngestionEvent([])).toThrow(
      IngestionContractViolationError,
    );
  });

  it("rejects an unknown envelope property", () => {
    expect(() =>
      parseIngestionEvent({
        ...validEvent,
        ingestedAt: "2026-07-24T00:00:00Z",
      }),
    ).toThrow(/ingestedAt/);
  });

  it("rejects an unregistered topic", () => {
    expect(() =>
      parseIngestionEvent({ ...validEvent, topic: "not-a-registered-topic" }),
    ).toThrow(/not-a-registered-topic/);
  });

  it("rejects a topic that is not a url safe label", () => {
    expect(() =>
      parseIngestionEvent({ ...validEvent, topic: "Dotfiles/Test Baseline" }),
    ).toThrow(/topic/);
  });

  it("rejects a schema version the topic contract does not serve", () => {
    expect(() =>
      parseIngestionEvent({ ...validEvent, schemaVersion: 2 }),
    ).toThrow(/schemaVersion/);
  });

  it("rejects a produced at stamp without a timezone designator", () => {
    expect(() =>
      parseIngestionEvent({ ...validEvent, producedAt: "2026-07-24T03:26:24" }),
    ).toThrow(/producedAt/);
  });

  it("rejects an unknown property inside the source block", () => {
    expect(() =>
      parseIngestionEvent({
        ...validEvent,
        source: { ...validEvent.source, branch: "main" },
      }),
    ).toThrow(/branch/);
  });

  it("rejects a source run url that is not https", () => {
    expect(() =>
      parseIngestionEvent({
        ...validEvent,
        source: { ...validEvent.source, runUrl: "http://example.com/run" },
      }),
    ).toThrow(/runUrl/);
  });

  it("rejects a missing payload", () => {
    const { payload: _omitted, ...withoutPayload } = validEvent;
    expect(() => parseIngestionEvent(withoutPayload)).toThrow(/payload/);
  });

  it("surfaces the topic payload violation rather than swallowing it", () => {
    expect(() =>
      parseIngestionEvent({
        ...validEvent,
        payload: { ...validEvent.payload, passedTests: 4 },
      }),
    ).toThrow(/passedTests/);
  });
});
