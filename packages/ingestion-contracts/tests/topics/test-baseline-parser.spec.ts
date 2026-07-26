import { describe, expect, it } from "vitest";
import { parseTestBaselinePayload } from "../../src/topics/test-baseline/test-baseline-parser";
import { IngestionContractViolationError } from "../../src/ingestion-types";
import { testBaselinePayloadFixture } from "../ingestion-test-fixtures";

describe("parseTestBaselinePayload", () => {
  const validPayload = testBaselinePayloadFixture;

  it("accepts a well formed baseline payload", () => {
    const payload = parseTestBaselinePayload(validPayload);
    expect(payload.totalTests).toBe(6);
    expect(payload.categories).toHaveLength(2);
    expect(payload.categories[0]?.tests).toHaveLength(2);
  });

  it("accepts a category name with the nested skill separator", () => {
    const payload = parseTestBaselinePayload(validPayload);
    expect(payload.categories[1]?.category).toBe("skills/nix/repo");
  });

  it("rejects an unknown payload property", () => {
    expect(() =>
      parseTestBaselinePayload({ ...validPayload, durationSeconds: 12 }),
    ).toThrow(/durationSeconds/);
  });

  it("rejects a pass rate outside the unit interval", () => {
    expect(() =>
      parseTestBaselinePayload({ ...validPayload, passRate: 1.4 }),
    ).toThrow(/passRate/);
  });

  it("rejects a pass rate that contradicts the test counts", () => {
    expect(() =>
      parseTestBaselinePayload({ ...validPayload, passRate: 0.1 }),
    ).toThrow(/passRate/);
  });

  it("rejects counts that do not add up to the total", () => {
    expect(() =>
      parseTestBaselinePayload({ ...validPayload, totalTests: 7 }),
    ).toThrow(/totalTests/);
  });

  it("rejects a category whose counts contradict its test list", () => {
    expect(() =>
      parseTestBaselinePayload({
        ...validPayload,
        categories: [
          { ...validPayload.categories[0], passed: 5 },
          validPayload.categories[1],
        ],
      }),
    ).toThrow(/adversarial/);
  });

  it("rejects categories whose totals disagree with the payload totals", () => {
    expect(() =>
      parseTestBaselinePayload({
        ...validPayload,
        categories: [validPayload.categories[0]],
      }),
    ).toThrow(/categories/);
  });

  it("rejects a duplicate category", () => {
    expect(() =>
      parseTestBaselinePayload({
        ...validPayload,
        categories: [validPayload.categories[0], validPayload.categories[0]],
      }),
    ).toThrow(/adversarial/);
  });

  it("rejects an empty category list", () => {
    expect(() =>
      parseTestBaselinePayload({ ...validPayload, categories: [] }),
    ).toThrow(IngestionContractViolationError);
  });

  it("rejects a fractional test count", () => {
    expect(() =>
      parseTestBaselinePayload({ ...validPayload, totalTests: 6.5 }),
    ).toThrow(/totalTests/);
  });

  it("rejects a recorded at stamp that is not a timestamp", () => {
    expect(() =>
      parseTestBaselinePayload({ ...validPayload, recordedAt: "yesterday" }),
    ).toThrow(/recordedAt/);
  });

  it("rejects a missing commit", () => {
    const { commit: _omitted, ...withoutCommit } = validPayload;
    expect(() => parseTestBaselinePayload(withoutCommit)).toThrow(/commit/);
  });
});
