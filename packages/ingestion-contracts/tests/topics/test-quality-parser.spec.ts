import { describe, expect, it } from "vitest";
import { parseTestQualityPayload } from "../../src/topics/test-quality/test-quality-parser";
import { IngestionContractViolationError } from "../../src/ingestion-types";
import { testQualityPayloadFixture } from "../ingestion-test-fixtures";

describe("parseTestQualityPayload", () => {
  const validPayload = testQualityPayloadFixture;

  it("accepts a well formed quality payload", () => {
    const payload = parseTestQualityPayload(validPayload);
    expect(payload.staticEvals.totalTests).toBe(163);
    expect(payload.endToEndScenarioCount).toBe(34);
    expect(payload.hooks.wiredEvents).toHaveLength(5);
  });

  it("keeps the pyramid tiers the dashboard reads", () => {
    const payload = parseTestQualityPayload(validPayload);
    expect(payload.staticEvals.suiteCount).toBe(15);
    expect(payload.integrationScenarioCount).toBe(7);
    expect(payload.coreRules.ruleBlockCount).toBe(18);
  });

  it("rejects an unknown payload property", () => {
    expect(() =>
      parseTestQualityPayload({ ...validPayload, skillCount: 21 }),
    ).toThrow(/skillCount/);
  });

  it("rejects an unknown property inside the static eval block", () => {
    expect(() =>
      parseTestQualityPayload({
        ...validPayload,
        staticEvals: { ...validPayload.staticEvals, failedTests: 11 },
      }),
    ).toThrow(/failedTests/);
  });

  it("rejects an unknown property inside the core rules block", () => {
    expect(() =>
      parseTestQualityPayload({
        ...validPayload,
        coreRules: { ...validPayload.coreRules, wordCount: 2200 },
      }),
    ).toThrow(/wordCount/);
  });

  it("rejects more passing evals than the suite ran", () => {
    expect(() =>
      parseTestQualityPayload({
        ...validPayload,
        staticEvals: { ...validPayload.staticEvals, passedTests: 200 },
      }),
    ).toThrow(/passedTests/);
  });

  it("rejects a pass rate that contradicts the eval counts", () => {
    expect(() =>
      parseTestQualityPayload({
        ...validPayload,
        staticEvals: { ...validPayload.staticEvals, passRate: 0.4 },
      }),
    ).toThrow(/passRate/);
  });

  it("rejects fewer hook entry points than wired hook events", () => {
    expect(() =>
      parseTestQualityPayload({
        ...validPayload,
        hooks: { ...validPayload.hooks, entryPointCount: 2 },
      }),
    ).toThrow(/entryPointCount/);
  });

  it("rejects the same hook event wired twice", () => {
    expect(() =>
      parseTestQualityPayload({
        ...validPayload,
        hooks: { ...validPayload.hooks, wiredEvents: ["stop", "stop"] },
      }),
    ).toThrow(/more than once/);
  });

  it("rejects a hook event that is not a url safe label", () => {
    expect(() =>
      parseTestQualityPayload({
        ...validPayload,
        hooks: { ...validPayload.hooks, wiredEvents: ["Stop Hook"] },
      }),
    ).toThrow(/wiredEvents/);
  });

  it("rejects more rule blocks than the core rules file has lines", () => {
    expect(() =>
      parseTestQualityPayload({
        ...validPayload,
        coreRules: { ...validPayload.coreRules, ruleBlockCount: 900 },
      }),
    ).toThrow(/ruleBlockCount/);
  });

  it("rejects an eval baseline stamp without a timezone designator", () => {
    expect(() =>
      parseTestQualityPayload({
        ...validPayload,
        staticEvals: {
          ...validPayload.staticEvals,
          recordedAt: "2026-07-24 03:26:24",
        },
      }),
    ).toThrow(/recordedAt/);
  });

  it("throws the contract violation type so the api answers with four hundred", () => {
    expect(() => parseTestQualityPayload({})).toThrow(
      IngestionContractViolationError,
    );
  });
});
