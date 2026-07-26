import { describe, expect, it } from "vitest";
import { parseClaudeUsagePayload } from "../../src/topics/claude-usage/claude-usage-parser";
import { IngestionContractViolationError } from "../../src/ingestion-types";
import { claudeUsagePayloadFixture } from "../ingestion-test-fixtures";

describe("parseClaudeUsagePayload", () => {
  const validPayload = claudeUsagePayloadFixture;

  it("accepts a well formed usage payload", () => {
    const payload = parseClaudeUsagePayload(validPayload);
    expect(payload.accountLabel).toBe("2c9c0c7cb164");
    expect(payload.models).toHaveLength(2);
    expect(payload.totalCostUsd).toBe(132.75);
  });

  it("accepts a model name that a url safe label would refuse", () => {
    const payload = parseClaudeUsagePayload(validPayload);
    expect(payload.models[1]?.model).toBe("gpt-5.6-sol");
  });

  it("accepts a machine that has not used any model yet", () => {
    const payload = parseClaudeUsagePayload({
      ...validPayload,
      models: [],
      totalCostUsd: 0,
      activity: {
        activeDayCount: 0,
        messageCount: 0,
        sessionCount: 0,
        toolCallCount: 0,
      },
    });
    expect(payload.models).toHaveLength(0);
  });

  it("rejects an unknown payload property", () => {
    expect(() =>
      parseClaudeUsagePayload({ ...validPayload, subscriptionPlan: "max" }),
    ).toThrow(/subscriptionPlan/);
  });

  it("rejects an unknown property on a model total", () => {
    expect(() =>
      parseClaudeUsagePayload({
        ...validPayload,
        models: [
          { ...validPayload.models[0], thinkingTokens: 12 },
          ...validPayload.models.slice(1),
        ],
      }),
    ).toThrow(/thinkingTokens/);
  });

  it("rejects an account label that is not url and object key safe", () => {
    expect(() =>
      parseClaudeUsagePayload({
        ...validPayload,
        accountLabel: "castro.lucas290@gmail.com",
      }),
    ).toThrow(/accountLabel/);
  });

  it("rejects a total cost the per model costs do not account for", () => {
    expect(() =>
      parseClaudeUsagePayload({ ...validPayload, totalCostUsd: 400 }),
    ).toThrow(IngestionContractViolationError);
  });

  it("rejects the same model reported twice", () => {
    expect(() =>
      parseClaudeUsagePayload({
        ...validPayload,
        models: [validPayload.models[0], validPayload.models[0]],
        totalCostUsd: 265,
      }),
    ).toThrow(/claude-opus-4-8/);
  });

  it("rejects a negative token count", () => {
    expect(() =>
      parseClaudeUsagePayload({
        ...validPayload,
        models: [
          { ...validPayload.models[0], outputTokens: -1 },
          ...validPayload.models.slice(1),
        ],
      }),
    ).toThrow(/outputTokens/);
  });

  it("rejects activity recorded against no active day at all", () => {
    expect(() =>
      parseClaudeUsagePayload({
        ...validPayload,
        activity: { ...validPayload.activity, activeDayCount: 0 },
      }),
    ).toThrow(/activeDayCount/);
  });

  it("rejects a recorded at stamp without a timezone designator", () => {
    expect(() =>
      parseClaudeUsagePayload({
        ...validPayload,
        recordedAt: "2026-07-26T02:40:11",
      }),
    ).toThrow(/recordedAt/);
  });

  it("rejects anything that is not an object at all", () => {
    expect(() => parseClaudeUsagePayload("usage")).toThrow(
      IngestionContractViolationError,
    );
  });
});
