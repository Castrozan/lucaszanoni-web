import { describe, expect, it } from "vitest";
import {
  readIngestedTestQualitySnapshot,
  testQualitySnapshotUrl,
} from "../../src/data/test-quality-snapshot";

const ingestedRecord = {
  receivedAt: "2026-07-24T21:09:05.000Z",
  event: {
    topic: "dotfiles-test-quality",
    schemaVersion: 1,
    producedAt: "2026-07-24T21:08:55.400Z",
    producer: "dotfiles-github-actions",
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
      coreRules: { lineCount: 165, ruleBlockCount: 18 },
      hooks: {
        wiredEvents: ["post-tool-use", "pre-tool-use", "session-start"],
        entryPointCount: 18,
      },
      goldStandardPractices: [
        {
          practice: "rubric-graded-judging",
          adopted: true,
          measurement: 19,
          measurementUnit: "of 25 eval suites",
          evidence: "Responses are graded against a written rubric.",
        },
        {
          practice: "repeated-sampling",
          adopted: false,
          measurement: 1,
          measurementUnit: "sampling epochs behind the committed baseline",
          evidence: "Rerunning across epochs turns one pass rate into a mean.",
        },
      ],
    },
  },
};

function recordWithEventOverrides(overrides: Record<string, unknown>) {
  return {
    ...ingestedRecord,
    event: { ...ingestedRecord.event, ...overrides },
  };
}

describe("the ingested test quality snapshot source", () => {
  it("reads the contracted latest object of its own topic", () => {
    expect(testQualitySnapshotUrl).toBe(
      "https://storage.googleapis.com/zg-url-shortener-2026-dotfiles-usage-snapshots/snapshots/dotfiles-test-quality/latest.json",
    );
  });

  it("carries the eval baseline, the pyramid tiers and the instruction surfaces", () => {
    const snapshot = readIngestedTestQualitySnapshot(ingestedRecord);

    expect(snapshot?.payload.staticEvals.passRate).toBe(0.9325);
    expect(snapshot?.payload.integrationScenarioCount).toBe(7);
    expect(snapshot?.payload.endToEndScenarioCount).toBe(34);
    expect(snapshot?.payload.coreRules.ruleBlockCount).toBe(18);
    expect(snapshot?.payload.hooks.wiredEvents).toHaveLength(3);
  });

  it("carries the measured gold standard verdicts the quality page scores itself with", () => {
    const snapshot = readIngestedTestQualitySnapshot(ingestedRecord);

    expect(
      snapshot?.payload.goldStandardPractices.map(
        (practice) => practice.practice,
      ),
    ).toEqual(["rubric-graded-judging", "repeated-sampling"]);
    expect(
      snapshot?.payload.goldStandardPractices.map(
        (practice) => practice.adopted,
      ),
    ).toEqual([true, false]);
  });

  it("refuses a record claiming a practice is adopted with nothing measured", () => {
    const unevidencedClaim = recordWithEventOverrides({
      payload: {
        ...ingestedRecord.event.payload,
        goldStandardPractices: [
          {
            practice: "repeated-sampling",
            adopted: true,
            measurement: 0,
            measurementUnit: "sampling epochs behind the committed baseline",
            evidence:
              "Rerunning across epochs turns one pass rate into a mean.",
          },
        ],
      },
    });

    expect(readIngestedTestQualitySnapshot(unevidencedClaim)).toBeNull();
  });

  it("refuses a record claiming more passing evals than the suite ran", () => {
    const impossibleTally = recordWithEventOverrides({
      payload: {
        ...ingestedRecord.event.payload,
        staticEvals: {
          ...ingestedRecord.event.payload.staticEvals,
          passedTests: 200,
        },
      },
    });

    expect(readIngestedTestQualitySnapshot(impossibleTally)).toBeNull();
  });

  it("refuses a record carrying a key the contract never declared", () => {
    const smuggledKey = recordWithEventOverrides({
      payload: { ...ingestedRecord.event.payload, skillCount: 21 },
    });

    expect(readIngestedTestQualitySnapshot(smuggledKey)).toBeNull();
  });

  it("refuses a record ingested under a different topic", () => {
    const otherTopic = recordWithEventOverrides({
      topic: "dotfiles-test-coverage",
    });

    expect(readIngestedTestQualitySnapshot(otherTopic)).toBeNull();
  });

  it("refuses anything that is not an ingested record at all", () => {
    expect(readIngestedTestQualitySnapshot(null)).toBeNull();
  });
});
