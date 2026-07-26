import Ajv from "ajv";
import { describe, expect, it } from "vitest";
import ingestionEventSchema from "../src/ingestion-event.schema.json";
import { parseIngestionEvent } from "../src/ingestion-event-parser";
import { INGESTION_TOPIC_CONTRACTS } from "../src/ingestion-topic-registry";
import { testBaselineEventFixture } from "./ingestion-test-fixtures";

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

describe("dual enforcement of the ingestion contracts", () => {
  it("accepts the reference event on both the schema and the parser", () => {
    expect(validateEnvelope(testBaselineEventFixture)).toBe(true);
    expect(
      validatePayload(
        testBaselineEventFixture.topic,
        testBaselineEventFixture.payload,
      ),
    ).toBe(true);
    expect(() => parseIngestionEvent(testBaselineEventFixture)).not.toThrow();
  });

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

  it("relies on the parser alone for cross field invariants json schema cannot express", () => {
    const contradictoryTotals = {
      ...testBaselineEventFixture.payload,
      totalTests: 7,
    };
    expect(
      validatePayload(testBaselineEventFixture.topic, contradictoryTotals),
    ).toBe(true);
    expect(() =>
      parseIngestionEvent({
        ...testBaselineEventFixture,
        payload: contradictoryTotals,
      }),
    ).toThrow(/totalTests/);
  });

  it("compiles the payload schema of every registered topic", () => {
    for (const contract of INGESTION_TOPIC_CONTRACTS) {
      expect(() => ajv.compile(contract.payloadSchema)).not.toThrow();
    }
  });
});
