import { describe, expect, it } from "vitest";
import { qualityOverviewFixture } from "../../../../packages/ingestion-contracts/tests/quality-overview-fixture";
import {
  coverageLabel,
  detailUrl,
  evidenceStatus,
  freshnessAt,
  safeEvidenceUrl,
} from "../../src/data/overview/evidence-status";

describe("current evidence status", () => {
  const evidence = qualityOverviewFixture().overview.evidence[0]!;
  const completion = Date.parse(evidence.run!.completedAt);
  it("expires an originally passing snapshot without changing the recorded outcome", () => {
    expect(evidenceStatus(evidence, completion + 1000)).toBe("passed");
    expect(evidenceStatus(evidence, completion + 3600001)).toBe("stale");
    expect(evidence.outcome).toBe("passed");
  });
  it("never turns missing, malformed, empty or unsupported evidence into pass", () => {
    for (const validity of [
      "missing",
      "malformed",
      "empty",
      "unsupported",
      "unmeasured",
      "incompatible",
      "pre-existing",
    ] as const)
      expect(evidenceStatus({ ...evidence, validity }, completion)).toBe(
        validity,
      );
    expect(freshnessAt(undefined, 60, completion)).toBe("unknown");
    expect(evidenceStatus(evidence, completion - 1)).toBe("unknown freshness");
  });
  it("keeps failures usable as evidence and zero coverage denominators unmeasured", () => {
    expect(evidenceStatus({ ...evidence, outcome: "failed" }, completion)).toBe(
      "failed",
    );
    expect(coverageLabel({ covered: 0, total: 0 })).toBe("unmeasured");
    expect(coverageLabel(null)).toBe("unmeasured");
    expect(coverageLabel({ covered: 0, total: 10 })).toBe("0/10 (0.0%)");
  });
  it("refuses unsafe links and escaped detail paths", () => {
    expect(safeEvidenceUrl("javascript:alert(1)")).toBeUndefined();
    expect(safeEvidenceUrl("https://user:secret@example.test")).toBeUndefined();
    expect(
      detailUrl("https://example.test/", {
        ...evidence,
        detailsUri: "../foreign.json",
      }),
    ).toBeUndefined();
  });
});
