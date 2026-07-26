export const instructionLoadingExperimentFixture = {
  recordedAt: "2026-07-23T22:35:02+00:00",
  recordedCommit: "7659f816",
  significanceAlpha: 0.05,
  categories: [
    {
      category: "workflow-compliance",
      pairedTests: 8,
      passRateWithInstructions: 1,
      passRateWithoutInstructions: 0.625,
      delta: 0.375,
      instructionsOnlyWins: 3,
      controlOnlyWins: 0,
      exactPValue: 0.25,
      significant: false,
    },
    {
      category: "core-rules",
      pairedTests: 12,
      passRateWithInstructions: 1,
      passRateWithoutInstructions: 0.917,
      delta: 0.083,
      instructionsOnlyWins: 1,
      controlOnlyWins: 0,
      exactPValue: 1,
      significant: false,
    },
  ],
} as const;
