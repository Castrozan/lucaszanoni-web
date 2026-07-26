import { describe, expect, it } from "vitest";
import {
  readIngestedTestBaselineSnapshot,
  testBaselineSnapshotUrl,
} from "../../src/data/test-baseline-snapshot";

const ingestedRecord = {
  receivedAt: "2026-07-24T03:26:30.000Z",
  event: {
    topic: "dotfiles-test-baseline",
    schemaVersion: 1,
    producedAt: "2026-07-24T03:26:24.774Z",
    producer: "dotfiles-github-actions",
    payload: {
      recordedAt: "2026-07-24T03:26:24.774576+00:00",
      commit: "5667c9f6",
      totalTests: 3,
      passedTests: 2,
      failedTests: 1,
      passRate: 0.6667,
      categories: [
        {
          category: "adversarial",
          passed: 1,
          failed: 0,
          tests: [{ name: "mass_staging_is_blocked", passed: true }],
        },
        {
          category: "skills/nix/repo",
          passed: 1,
          failed: 1,
          tests: [
            { name: "rebuild_is_run_by_the_agent", passed: true },
            { name: "rebuild_is_never_deferred", passed: false },
          ],
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

describe("the ingested test baseline snapshot source", () => {
  it("reads the contracted latest object of its own topic", () => {
    expect(testBaselineSnapshotUrl).toBe(
      "https://storage.googleapis.com/zg-url-shortener-2026-dotfiles-usage-snapshots/snapshots/dotfiles-test-baseline/latest.json",
    );
  });

  it("carries the run totals and both stamps of a contracted record", () => {
    const snapshot = readIngestedTestBaselineSnapshot(ingestedRecord);

    expect(snapshot?.receivedAt).toBe("2026-07-24T03:26:30.000Z");
    expect(snapshot?.producedAt).toBe("2026-07-24T03:26:24.774Z");
    expect(snapshot?.payload.passedTests).toBe(2);
    expect(snapshot?.payload.categories).toHaveLength(2);
  });

  it("refuses a record whose payload breaks a cross field invariant", () => {
    const inconsistentTotals = recordWithEventOverrides({
      payload: { ...ingestedRecord.event.payload, passedTests: 3 },
    });

    expect(readIngestedTestBaselineSnapshot(inconsistentTotals)).toBeNull();
  });

  it("refuses a record carrying a key the contract never declared", () => {
    const smuggledKey = recordWithEventOverrides({ retries: 2 });

    expect(readIngestedTestBaselineSnapshot(smuggledKey)).toBeNull();
  });

  it("refuses a record ingested under a different topic", () => {
    const otherTopic = recordWithEventOverrides({ topic: "claude-usage" });

    expect(readIngestedTestBaselineSnapshot(otherTopic)).toBeNull();
  });

  it("refuses anything that is not an ingested record at all", () => {
    expect(readIngestedTestBaselineSnapshot(null)).toBeNull();
    expect(readIngestedTestBaselineSnapshot("latest.json")).toBeNull();
  });
});
