import { describe, expect, it } from "vitest";
import { parseTestQualityPayload } from "../../src/topics/test-quality/test-quality-parser";
import { IngestionContractViolationError } from "../../src/ingestion-types";
import { testQualityPayloadFixture } from "../ingestion-test-fixtures";
import { instructionLoadingExperimentFixture } from "../test-quality-instruction-loading-fixture";

function parseWithExperiment(experiment: unknown) {
  return parseTestQualityPayload({
    ...testQualityPayloadFixture,
    instructionLoadingExperiment: experiment,
  });
}

function parseWithCategoryOverride(override: Record<string, unknown>) {
  const [firstCategory, ...remainingCategories] =
    instructionLoadingExperimentFixture.categories;
  return parseWithExperiment({
    ...instructionLoadingExperimentFixture,
    categories: [{ ...firstCategory, ...override }, ...remainingCategories],
  });
}

describe("test quality instruction loading experiment", () => {
  it("carries every paired comparison the experiment recorded", () => {
    const payload = parseWithExperiment(instructionLoadingExperimentFixture);

    expect(
      payload.instructionLoadingExperiment.categories.map(
        (category) => category.category,
      ),
    ).toEqual(["workflow-compliance", "core-rules"]);
  });

  it("carries the alpha the significance verdicts were taken against", () => {
    const payload = parseWithExperiment(instructionLoadingExperimentFixture);

    expect(payload.instructionLoadingExperiment.significanceAlpha).toBe(0.05);
    expect(payload.instructionLoadingExperiment.recordedCommit).toBe(
      "7659f816",
    );
  });

  it("carries a delta measured against the stripped control arm", () => {
    const payload = parseWithExperiment(instructionLoadingExperimentFixture);

    expect(
      payload.instructionLoadingExperiment.categories.map(
        (category) => category.delta,
      ),
    ).toEqual([0.375, 0.083]);
  });

  it("refuses an experiment with no measured category at all", () => {
    expect(() =>
      parseWithExperiment({
        ...instructionLoadingExperimentFixture,
        categories: [],
      }),
    ).toThrow(IngestionContractViolationError);
  });

  it("refuses a delta that does not match the two rates it sits between", () => {
    expect(() => parseWithCategoryOverride({ delta: 0.9 })).toThrow(/delta/);
  });

  it("refuses more discordant pairs than there were paired tests", () => {
    expect(() =>
      parseWithCategoryOverride({
        instructionsOnlyWins: 6,
        controlOnlyWins: 4,
      }),
    ).toThrow(/paired tests/);
  });

  it("refuses a pass rate that no whole number of tests could produce", () => {
    expect(() =>
      parseWithCategoryOverride({
        passRateWithoutInstructions: 0.5,
        delta: 0.5,
      }),
    ).not.toThrow();
    expect(() =>
      parseWithCategoryOverride({
        passRateWithoutInstructions: 0.6,
        delta: 0.4,
      }),
    ).toThrow(/whole number of tests/);
  });

  it("refuses a significance verdict that disagrees with its own p-value", () => {
    expect(() => parseWithCategoryOverride({ significant: true })).toThrow(
      /significant/,
    );
  });

  it("refuses the same category reported twice", () => {
    expect(() =>
      parseWithExperiment({
        ...instructionLoadingExperimentFixture,
        categories: [
          instructionLoadingExperimentFixture.categories[0],
          instructionLoadingExperimentFixture.categories[0],
        ],
      }),
    ).toThrow(/more than once/);
  });

  it("refuses an unknown key smuggled into a category", () => {
    expect(() => parseWithCategoryOverride({ effectSize: 0.4 })).toThrow(
      IngestionContractViolationError,
    );
  });
});
