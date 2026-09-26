import { describe, expect, it } from "vitest";
import { parseQualityOverviewPayload } from "../../src/topics/quality-overview/quality-overview-parser";
import {
  artifactOverviewFixture,
  replaceOverviewEvidence,
} from "../quality-overview-fixture";

describe("artifact identity and detail origins", () => {
  it("accepts native artifact evidence and rejects changed identity or case counts", () => {
    const payload = artifactOverviewFixture();
    expect(parseQualityOverviewPayload(payload)).toEqual(payload);
    const evidence = payload.overview.evidence[0]!;
    const measurement = evidence.measurement!;
    if (measurement.kind !== "artifact")
      throw new Error("Invalid owned fixture");
    for (const changed of [
      { ...measurement, artifactAfter: "f".repeat(64) },
      { ...measurement, counts: { ...measurement.counts, expected: 2 } },
      { ...measurement, cases: [...measurement.cases, ...measurement.cases] },
      { ...measurement, gate: "fail" },
    ]) {
      expect(() =>
        parseQualityOverviewPayload({
          ...payload,
          overview: {
            ...payload.overview,
            evidence: [{ ...evidence, measurement: changed }],
          },
        }),
      ).toThrow();
    }
  });

  it("rejects a detail fetch outside the immutable evidence directory", () => {
    expect(() =>
      parseQualityOverviewPayload(
        replaceOverviewEvidence({ detailsUri: "../foreign.json" }),
      ),
    ).toThrow(/detail path/);
  });
});
