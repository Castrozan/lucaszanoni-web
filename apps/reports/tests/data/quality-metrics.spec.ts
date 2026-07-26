import { describe, expect, it } from "vitest";
import {
  formatMetricsGeneratedDate,
  readQualityMetricsFromIngestedSnapshot,
} from "../../src/data/quality-metrics";

const ingestedSnapshot = {
  receivedAt: "2026-07-24T21:09:05.000Z",
  producedAt: "2026-07-24T21:08:55.400Z",
  payload: {
    recordedAt: "2026-10-02T08:00:00+00:00",
    commit: "0ffe1ded",
    staticEvals: {
      totalTests: 163,
      passedTests: 152,
      passRate: 0.9325,
      suiteCount: 15,
      categoryCount: 23,
      recordedAt: "2026-07-24T03:26:24.774576+00:00",
      recordedCommit: "5667c9f6",
    },
    integrationScenarioCount: 7,
    endToEndScenarioCount: 34,
    coreRules: { lineCount: 165, ruleBlockCount: 18 },
    hooks: {
      wiredEvents: ["post-tool-use", "pre-tool-use", "session-start"],
      entryPointCount: 18,
    },
    goldStandardPractices: [
      {
        practice: "adversarial-testing",
        adopted: true,
        measurement: 5,
        measurementUnit: "prompt-injection cases",
        evidence: "A suite drives injection attempts at the guard hooks.",
      },
    ],
  },
};

describe("formatMetricsGeneratedDate", () => {
  it("renders an ISO timestamp as a plain calendar date", () => {
    expect(formatMetricsGeneratedDate("2026-07-22T20:13:44.506132+00:00")).toBe(
      "2026-07-22",
    );
  });

  it("degrades to a readable phrase when the timestamp is unparseable", () => {
    expect(formatMetricsGeneratedDate("whenever")).toBe("an unknown date");
  });
});

describe("readQualityMetricsFromIngestedSnapshot", () => {
  it("stamps the page with the commit and time the payload was measured at", () => {
    const metrics = readQualityMetricsFromIngestedSnapshot(ingestedSnapshot);

    expect(metrics.generatedCommit).toBe("0ffe1ded");
    expect(metrics.generatedAt).toBe("2026-10-02T08:00:00+00:00");
  });

  it("carries every count the quality page renders", () => {
    const metrics = readQualityMetricsFromIngestedSnapshot(ingestedSnapshot);

    expect(metrics.staticEvals.totalTests).toBe(163);
    expect(metrics.integrationScenarioCount).toBe(7);
    expect(metrics.endToEndScenarioCount).toBe(34);
    expect(metrics.coreRules.ruleBlockCount).toBe(18);
    expect(metrics.hooks.entryPointCount).toBe(18);
  });

  it("carries the measured gold standard practices", () => {
    const metrics = readQualityMetricsFromIngestedSnapshot(ingestedSnapshot);

    expect(
      metrics.goldStandardPractices.map((practice) => practice.practice),
    ).toEqual(["adversarial-testing"]);
  });
});
