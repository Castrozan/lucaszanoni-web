import Ajv from "ajv";
import addFormats from "ajv-formats";
import { describe, expect, it } from "vitest";
import { parseIngestionEvent } from "../../src/ingestion-event-parser";
import { qualityOverviewContract } from "../../src/topics/quality-overview/quality-overview-contract";
import { parseQualityOverviewPayload } from "../../src/topics/quality-overview/quality-overview-parser";
import {
  qualityOverviewFixture,
  replaceOverviewEvidence,
} from "../quality-overview-fixture";

const validator = new Ajv({ allErrors: true });
addFormats(validator);
const validateSchema = validator.compile(qualityOverviewContract.payloadSchema);

describe("quality overview evidence ingestion", () => {
  it("accepts the portable schema and keeps passing tests separate from workflow failure", () => {
    const payload = qualityOverviewFixture();
    expect(validateSchema(payload)).toBe(true);
    expect(parseQualityOverviewPayload(payload)).toEqual(payload);
    expect(
      parseIngestionEvent({
        topic: qualityOverviewContract.topic,
        schemaVersion: 1,
        producedAt: payload.overview.generatedAt,
        producer: "owned-fixture",
        payload,
      }).payload,
    ).toEqual(payload);
    expect(payload.workflow.conclusion).toBe("failure");
    expect(payload.overview.evidence[0]!.outcome).toBe("passed");
    expect(payload.overview.evidence[1]!.usable).toBe(false);
  });

  it("accepts HTTPS evidence on a different storage provider without changing run provenance", () => {
    const original = qualityOverviewFixture();
    const payload = {
      ...original,
      detailsBaseUrl: `https://artifacts.example.test/site/reports/overview/${original.workflow.runId}/${original.workflow.runAttempt}/`,
    };
    expect(validateSchema(payload)).toBe(true);
    expect(parseQualityOverviewPayload(payload)).toEqual(payload);
  });

  it.each([
    {
      name: "empty evidence",
      value: {
        ...qualityOverviewFixture(),
        overview: { ...qualityOverviewFixture().overview, evidence: [] },
      },
    },
    {
      name: "unknown field",
      value: { ...qualityOverviewFixture(), inventedScore: 100 },
    },
    {
      name: "invalid timestamp",
      value: {
        ...qualityOverviewFixture(),
        workflow: {
          ...qualityOverviewFixture().workflow,
          startedAt: "not-a-time",
        },
      },
    },
    {
      name: "wrong schema version",
      value: {
        ...qualityOverviewFixture(),
        overview: { ...qualityOverviewFixture().overview, schemaVersion: 2 },
      },
    },
    {
      name: "untrusted detail origin",
      value: {
        ...qualityOverviewFixture(),
        detailsBaseUrl: "javascript:alert(1)",
      },
    },
  ])("rejects $name through schema and parser", ({ value }) => {
    expect(validateSchema(value)).toBe(false);
    expect(() => parseQualityOverviewPayload(value)).toThrow();
  });

  it.each([
    {
      name: "wrong revision",
      value: {
        ...qualityOverviewFixture(),
        workflow: {
          ...qualityOverviewFixture().workflow,
          revision: "f".repeat(40),
        },
      },
    },
    {
      name: "wrong run URL",
      value: {
        ...qualityOverviewFixture(),
        workflow: {
          ...qualityOverviewFixture().workflow,
          runUrl: "https://github.com/Castrozan/.dotfiles/actions/runs/2",
        },
      },
    },
    {
      name: "wrong detail attempt",
      value: {
        ...qualityOverviewFixture(),
        workflow: { ...qualityOverviewFixture().workflow, runAttempt: 2 },
      },
    },
    {
      name: "reversed timestamps",
      value: {
        ...qualityOverviewFixture(),
        workflow: {
          ...qualityOverviewFixture().workflow,
          completedAt: "2026-09-25T00:00:00Z",
        },
      },
    },
    {
      name: "contradictory usability",
      value: replaceOverviewEvidence({ validity: "missing" }),
    },
    {
      name: "no passing measurement",
      value: replaceOverviewEvidence({ measurement: null }),
    },
    {
      name: "unreconciled counts",
      value: replaceOverviewEvidence({
        measurement: {
          kind: "tests",
          counts: { passed: 2, failed: 0, error: 0, skipped: 0, total: 3 },
          durationSeconds: null,
        },
      }),
    },
    {
      name: "failure disguised as pass",
      value: replaceOverviewEvidence({
        measurement: {
          kind: "tests",
          counts: { passed: 1, failed: 1, error: 0, skipped: 1, total: 3 },
          durationSeconds: null,
        },
      }),
    },
    {
      name: "coverage beyond scope",
      value: replaceOverviewEvidence({
        outcome: "measured",
        measurement: {
          kind: "coverage",
          lineCoverage: { covered: 2, total: 1 },
          branchCoverage: null,
          files: 1,
        },
      }),
    },
  ])("rejects semantic contradiction: $name", ({ value }) => {
    expect(validateSchema(value)).toBe(true);
    expect(() => parseQualityOverviewPayload(value)).toThrow();
  });

  it("preserves stale passing execution as stale unusable evidence", () => {
    const payload = replaceOverviewEvidence({
      freshness: { status: "stale", ageSeconds: 7200, maxAgeSeconds: 3600 },
      usable: false,
    });
    expect(
      parseQualityOverviewPayload(payload).overview.evidence[0]!.freshness
        .status,
    ).toBe("stale");
  });

  it("rejects duplicate evidence identifiers", () => {
    const payload = qualityOverviewFixture();
    expect(() =>
      parseQualityOverviewPayload({
        ...payload,
        overview: {
          ...payload.overview,
          evidence: [
            payload.overview.evidence[0],
            payload.overview.evidence[0],
          ],
        },
      }),
    ).toThrow(/duplicate/);
  });
});
