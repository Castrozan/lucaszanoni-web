import { describe, expect, it } from "vitest";
import {
  readIngestedTestCoverageSnapshot,
  testCoverageSnapshotUrl,
} from "../../src/data/test-coverage-snapshot";

const ingestedRecord = {
  receivedAt: "2026-07-24T21:09:02.000Z",
  event: {
    topic: "dotfiles-test-coverage",
    schemaVersion: 1,
    producedAt: "2026-07-24T21:08:50.120Z",
    producer: "dotfiles-github-actions",
    payload: {
      recordedAt: "2026-07-24T21:08:44Z",
      commit: "9a7b1f32",
      coveredLines: 33,
      measurableLines: 141,
      lineCoverageRate: 0.234,
      files: [
        {
          path: "home/base/security/scripts/bw-session.sh",
          coveredLines: 28,
          measurableLines: 28,
          lineCoverageRate: 1,
        },
        {
          path: "home/base/system/scripts/rebuild",
          coveredLines: 5,
          measurableLines: 113,
          lineCoverageRate: 0.0442,
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

describe("the ingested test coverage snapshot source", () => {
  it("reads the contracted latest object of its own topic", () => {
    expect(testCoverageSnapshotUrl).toBe(
      "https://storage.googleapis.com/zg-url-shortener-2026-dotfiles-usage-snapshots/snapshots/dotfiles-test-coverage/latest.json",
    );
  });

  it("carries the run totals and every measured file of a contracted record", () => {
    const snapshot = readIngestedTestCoverageSnapshot(ingestedRecord);

    expect(snapshot?.receivedAt).toBe("2026-07-24T21:09:02.000Z");
    expect(snapshot?.payload.coveredLines).toBe(33);
    expect(snapshot?.payload.measurableLines).toBe(141);
    expect(snapshot?.payload.files).toHaveLength(2);
  });

  it("refuses a record whose measured files contradict the run totals", () => {
    const droppedFile = recordWithEventOverrides({
      payload: {
        ...ingestedRecord.event.payload,
        files: ingestedRecord.event.payload.files.slice(1),
      },
    });

    expect(readIngestedTestCoverageSnapshot(droppedFile)).toBeNull();
  });

  it("refuses a record whose measured path escapes the repository", () => {
    const escapingPath = recordWithEventOverrides({
      payload: {
        ...ingestedRecord.event.payload,
        files: [
          {
            ...ingestedRecord.event.payload.files[0],
            path: "../etc/shadow",
          },
          ingestedRecord.event.payload.files[1],
        ],
      },
    });

    expect(readIngestedTestCoverageSnapshot(escapingPath)).toBeNull();
  });

  it("refuses a record ingested under a different topic", () => {
    const otherTopic = recordWithEventOverrides({
      topic: "dotfiles-test-baseline",
    });

    expect(readIngestedTestCoverageSnapshot(otherTopic)).toBeNull();
  });

  it("refuses anything that is not an ingested record at all", () => {
    expect(readIngestedTestCoverageSnapshot(null)).toBeNull();
  });
});
