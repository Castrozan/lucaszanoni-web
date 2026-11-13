import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { classifyArtifactObjectKey } from "../src/artifact-object-key-policy";

const safeSegment = fc.stringMatching(/^[A-Za-z0-9][A-Za-z0-9._-]{0,20}$/);

describe("classifying an artifact object key", () => {
  it("accepts any report key built from plain segments", () => {
    fc.assert(
      fc.property(
        fc.array(safeSegment, { minLength: 1, maxLength: 5 }),
        (segments) => {
          expect(
            classifyArtifactObjectKey(`reports/${segments.join("/")}`),
          ).toBe("report");
        },
      ),
    );
  });

  it("refuses a report key with a traversal, empty, backslash or control segment anywhere", () => {
    const hostile = fc.constantFrom("..", ".", "", "a\\b", "a\u0000b", "a\nb");
    fc.assert(
      fc.property(
        fc.array(safeSegment, { maxLength: 2 }),
        hostile,
        fc.array(safeSegment, { maxLength: 2 }),
        (before, segment, after) => {
          const key = ["reports", ...before, segment, ...after].join("/");
          expect(classifyArtifactObjectKey(key)).toBeUndefined();
        },
      ),
    );
  });

  it("accepts only the flat raw snapshot shape and keeps event and latest keys out", () => {
    expect(classifyArtifactObjectKey("snapshots/acct-host.json")).toBe(
      "raw-snapshot",
    );
    for (const key of [
      "snapshots/dotfiles-test-baseline/latest.json",
      "snapshots/dotfiles-test-baseline/events/2026-07-24T03:26:24.774Z-5667c9f6.json",
      "snapshots/nolabeljoin.json",
      "snapshots/../acct-host.json",
      "aggregate/machine-usage-snapshots.json",
      "reports",
      `reports/${"a".repeat(600)}`,
    ]) {
      expect(classifyArtifactObjectKey(key), key).toBeUndefined();
    }
  });
});
