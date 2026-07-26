import { goldStandardPracticesFixture } from "./test-quality-gold-standard-fixture";

export const testBaselineEventFixture = {
  topic: "dotfiles-test-baseline",
  schemaVersion: 1,
  producedAt: "2026-07-24T03:26:24.774Z",
  producer: "dotfiles-github-actions",
  source: {
    repository: "Castrozan/.dotfiles",
    commit: "5667c9f6",
    runUrl: "https://github.com/Castrozan/.dotfiles/actions/runs/1",
  },
  payload: {
    recordedAt: "2026-07-24T03:26:24.774576+00:00",
    commit: "5667c9f6",
    totalTests: 6,
    passedTests: 5,
    failedTests: 1,
    passRate: 0.8333,
    categories: [
      {
        category: "adversarial",
        passed: 2,
        failed: 0,
        tests: [
          { name: "injection_rewriting_core_rules_is_blocked", passed: true },
          { name: "mass_staging_git_add_all_is_blocked", passed: true },
        ],
      },
      {
        category: "skills/nix/repo",
        passed: 3,
        failed: 1,
        tests: [
          { name: "nix_explains_lazy_evaluation", passed: true },
          { name: "nix_knows_module_layout", passed: true },
          { name: "nix_knows_secret_packaging", passed: true },
          { name: "nix_knows_overlay_ordering", passed: false },
        ],
      },
    ],
  },
} as const;

export const testBaselinePayloadFixture = testBaselineEventFixture.payload;

export const testCoverageEventFixture = {
  topic: "dotfiles-test-coverage",
  schemaVersion: 1,
  producedAt: "2026-07-24T21:08:45.630Z",
  producer: "dotfiles-github-actions",
  source: {
    repository: "Castrozan/.dotfiles",
    commit: "9a7b1f32",
    runUrl: "https://github.com/Castrozan/.dotfiles/actions/runs/1",
  },
  payload: {
    recordedAt: "2026-07-24T21:08:44Z",
    commit: "9a7b1f32",
    coveredLines: 61,
    measurableLines: 169,
    lineCoverageRate: 0.3609,
    files: [
      {
        path: "home/base/security/scripts/bw-session.sh",
        coveredLines: 28,
        measurableLines: 28,
        lineCoverageRate: 1,
      },
      {
        path: "home/base/system/scripts/rebuild",
        coveredLines: 28,
        measurableLines: 125,
        lineCoverageRate: 0.224,
      },
      {
        path: "home/base/terminal/scripts/tmux-restore-pane-after-toggle",
        coveredLines: 5,
        measurableLines: 16,
        lineCoverageRate: 0.3125,
      },
    ],
  },
} as const;

export const testCoveragePayloadFixture = testCoverageEventFixture.payload;

export const testQualityEventFixture = {
  topic: "dotfiles-test-quality",
  schemaVersion: 1,
  producedAt: "2026-07-24T21:08:45.700Z",
  producer: "dotfiles-github-actions",
  source: {
    repository: "Castrozan/.dotfiles",
    commit: "9a7b1f32",
    runUrl: "https://github.com/Castrozan/.dotfiles/actions/runs/1",
  },
  payload: {
    recordedAt: "2026-07-24T21:08:45.630094+00:00",
    commit: "9a7b1f32",
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
    coreRules: {
      lineCount: 165,
      ruleBlockCount: 18,
    },
    hooks: {
      wiredEvents: [
        "post-tool-use",
        "pre-tool-use",
        "session-start",
        "stop",
        "user-prompt-submit",
      ],
      entryPointCount: 18,
    },
    goldStandardPractices: goldStandardPracticesFixture,
  },
} as const;

export const testQualityPayloadFixture = testQualityEventFixture.payload;

export const claudeUsageEventFixture = {
  topic: "claude-usage",
  schemaVersion: 1,
  producedAt: "2026-07-26T02:40:11.220Z",
  producer: "dotfiles-usage-exporter",
  payload: {
    recordedAt: "2026-07-26T02:40:11.204817+00:00",
    accountLabel: "2c9c0c7cb164",
    machineLabel: "71fc83e765e0",
    models: [
      {
        model: "claude-opus-4-8",
        inputTokens: 1204,
        outputTokens: 88301,
        cacheReadInputTokens: 41938226,
        cacheCreationInputTokens: 2210447,
        costUsd: 132.5,
      },
      {
        model: "gpt-5.6-sol",
        inputTokens: 9,
        outputTokens: 1633,
        cacheReadInputTokens: 0,
        cacheCreationInputTokens: 0,
        costUsd: 0.25,
      },
    ],
    totalCostUsd: 132.75,
    activity: {
      activeDayCount: 53,
      messageCount: 18422,
      sessionCount: 1104,
      toolCallCount: 62319,
    },
  },
} as const;

export const claudeUsagePayloadFixture = claudeUsageEventFixture.payload;
