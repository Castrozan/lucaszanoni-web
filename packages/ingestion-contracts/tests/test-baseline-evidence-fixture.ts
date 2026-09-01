import { testBaselineEventFixture } from "./ingestion-test-fixtures";

const executionProfile = {
  subject: {
    harness: "codex",
    model: "gpt-5.6-sol",
    reasoningEffort: "high",
  },
  judge: {
    harness: "codex",
    model: "gpt-5.6-luna",
    reasoningEffort: "low",
  },
};

export const testBaselineEvidencePayloadFixture = {
  ...testBaselineEventFixture.payload,
  oldestEvidenceAt: "2026-07-20T03:26:24.774576+00:00",
  minimumCurrentEvidence: 5,
  executionProfile,
  executionProfiles: [{ id: "codex-profile", ...executionProfile }],
  tokenUsage: {
    subject: {
      codex: {
        invocations: 3,
        measuredInvocations: 3,
        inputTokens: 120,
        cachedInputTokens: 80,
        cacheWriteInputTokens: 0,
        outputTokens: 20,
        reasoningOutputTokens: 5,
      },
    },
  },
  categories: testBaselineEventFixture.payload.categories.map((category) => ({
    ...category,
    tests: category.tests.map((test, index) => {
      const runSource =
        index === 0
          ? { kind: "recovered_progress", sessionId: 66279 }
          : { kind: "checkpoint", gitCommit: "5667c9f6" };
      return {
        ...test,
        fingerprint: `${category.category}-${index}`,
        generatedAt: "2026-07-24T03:26:24.774576+00:00",
        executionProfileId: "codex-profile",
        runSource,
      };
    }),
  })),
};

export const testBaselineEvidenceEventFixture = {
  ...testBaselineEventFixture,
  payload: testBaselineEvidencePayloadFixture,
};
