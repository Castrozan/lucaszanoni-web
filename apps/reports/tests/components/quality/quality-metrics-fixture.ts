import type { QualityMetrics } from "../../../src/data/quality-metrics";

const measuredPayload = {
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
    {
      practice: "repeated-sampling",
      adopted: false,
      measurement: 1,
      measurementUnit: "sampling epochs behind the committed baseline",
      evidence: "Rerunning across epochs turns one pass rate into a mean.",
    },
  ],
};

export const ingestedQualityRecordFixture = {
  receivedAt: "2026-07-24T21:09:05.000Z",
  event: {
    topic: "dotfiles-test-quality",
    schemaVersion: 1,
    producedAt: "2026-07-24T21:08:55.400Z",
    producer: "dotfiles-github-actions",
    payload: measuredPayload,
  },
};

export const qualityMetricsFixture: QualityMetrics = {
  generatedAt: measuredPayload.recordedAt,
  generatedCommit: measuredPayload.commit,
  staticEvals: measuredPayload.staticEvals,
  integrationScenarioCount: measuredPayload.integrationScenarioCount,
  endToEndScenarioCount: measuredPayload.endToEndScenarioCount,
  coreRules: measuredPayload.coreRules,
  hooks: measuredPayload.hooks,
  goldStandardPractices: measuredPayload.goldStandardPractices,
};
