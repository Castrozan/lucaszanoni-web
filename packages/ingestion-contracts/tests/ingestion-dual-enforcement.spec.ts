import Ajv from "ajv";
import { describe, expect, it } from "vitest";
import ingestionEventSchema from "../src/ingestion-event.schema.json";
import { parseIngestionEvent } from "../src/ingestion-event-parser";
import { INGESTION_TOPIC_CONTRACTS } from "../src/ingestion-topic-registry";
import {
  claudeUsageEventFixture,
  testBaselineEventFixture,
  testCoverageEventFixture,
  testQualityEventFixture,
} from "./ingestion-test-fixtures";

const ajv = new Ajv({ allErrors: true });
const validateEnvelope = ajv.compile(ingestionEventSchema);

function validatePayload(topic: string, payload: unknown): boolean {
  const contract = INGESTION_TOPIC_CONTRACTS.find(
    (candidate) => candidate.topic === topic,
  );
  if (contract === undefined) {
    throw new Error(`no contract registered for topic ${topic}`);
  }
  return ajv.validate(contract.payloadSchema, payload);
}

const structurallyInvalidEvents: readonly {
  readonly label: string;
  readonly event: Record<string, unknown>;
}[] = [
  {
    label: "an unknown envelope property",
    event: { ...testBaselineEventFixture, ingestedAt: "2026-07-24T00:00:00Z" },
  },
  {
    label: "a topic that is not a url safe label",
    event: { ...testBaselineEventFixture, topic: "Dotfiles/Test Baseline" },
  },
  {
    label: "a fractional schema version",
    event: { ...testBaselineEventFixture, schemaVersion: 1.5 },
  },
  {
    label: "a produced at stamp without a timezone designator",
    event: { ...testBaselineEventFixture, producedAt: "2026-07-24T03:26:24" },
  },
  {
    label: "an unknown property inside the source block",
    event: {
      ...testBaselineEventFixture,
      source: { ...testBaselineEventFixture.source, branch: "main" },
    },
  },
  {
    label: "a missing payload",
    event: (() => {
      const { payload: _omitted, ...withoutPayload } = testBaselineEventFixture;
      return withoutPayload;
    })(),
  },
];

const structurallyInvalidPayloads: readonly {
  readonly label: string;
  readonly payload: Record<string, unknown>;
}[] = [
  {
    label: "an unknown payload property",
    payload: { ...testBaselineEventFixture.payload, durationSeconds: 12 },
  },
  {
    label: "a pass rate outside the unit interval",
    payload: { ...testBaselineEventFixture.payload, passRate: 1.4 },
  },
  {
    label: "a fractional test count",
    payload: { ...testBaselineEventFixture.payload, totalTests: 6.5 },
  },
  {
    label: "an empty category list",
    payload: { ...testBaselineEventFixture.payload, categories: [] },
  },
];

const referenceEvents: readonly {
  readonly label: string;
  readonly event: { readonly topic: string; readonly payload: unknown };
}[] = [
  { label: "dotfiles-test-baseline", event: testBaselineEventFixture },
  { label: "dotfiles-test-coverage", event: testCoverageEventFixture },
  { label: "dotfiles-test-quality", event: testQualityEventFixture },
  { label: "claude-usage", event: claudeUsageEventFixture },
];

const crossFieldViolations: readonly {
  readonly label: string;
  readonly topic: string;
  readonly event: Record<string, unknown>;
  readonly payload: Record<string, unknown>;
  readonly rejection: RegExp;
}[] = [
  {
    label: "an eval total that contradicts its categories",
    topic: testBaselineEventFixture.topic,
    event: testBaselineEventFixture,
    payload: { ...testBaselineEventFixture.payload, totalTests: 7 },
    rejection: /totalTests/,
  },
  {
    label: "measured files that do not account for the run totals",
    topic: testCoverageEventFixture.topic,
    event: testCoverageEventFixture,
    payload: {
      ...testCoverageEventFixture.payload,
      files: testCoverageEventFixture.payload.files.slice(1),
    },
    rejection: /account for/,
  },
  {
    label: "more passing evals than the suite ran",
    topic: testQualityEventFixture.topic,
    event: testQualityEventFixture,
    payload: {
      ...testQualityEventFixture.payload,
      staticEvals: {
        ...testQualityEventFixture.payload.staticEvals,
        passedTests: 200,
      },
    },
    rejection: /passedTests/,
  },
  {
    label: "a usage spend the per model costs do not account for",
    topic: claudeUsageEventFixture.topic,
    event: claudeUsageEventFixture,
    payload: { ...claudeUsageEventFixture.payload, totalCostUsd: 400 },
    rejection: /totalCostUsd/,
  },
];

describe("dual enforcement of the ingestion contracts", () => {
  it.each(referenceEvents)(
    "accepts the $label reference event on both the schema and the parser",
    ({ event }) => {
      expect(validateEnvelope(event)).toBe(true);
      expect(validatePayload(event.topic, event.payload)).toBe(true);
      expect(() => parseIngestionEvent(event)).not.toThrow();
    },
  );

  it.each(structurallyInvalidEvents)(
    "rejects $label on both the schema and the parser",
    ({ event }) => {
      expect(validateEnvelope(event)).toBe(false);
      expect(() => parseIngestionEvent(event)).toThrow();
    },
  );

  it.each(structurallyInvalidPayloads)(
    "rejects $label on both the schema and the parser",
    ({ payload }) => {
      expect(validatePayload(testBaselineEventFixture.topic, payload)).toBe(
        false,
      );
      expect(() =>
        parseIngestionEvent({ ...testBaselineEventFixture, payload }),
      ).toThrow();
    },
  );

  it.each(crossFieldViolations)(
    "relies on the parser alone to reject $label",
    ({ topic, event, payload, rejection }) => {
      expect(validatePayload(topic, payload)).toBe(true);
      expect(() => parseIngestionEvent({ ...event, payload })).toThrow(
        rejection,
      );
    },
  );

  it("compiles the payload schema of every registered topic", () => {
    for (const contract of INGESTION_TOPIC_CONTRACTS) {
      expect(() => ajv.compile(contract.payloadSchema)).not.toThrow();
    }
  });
});
