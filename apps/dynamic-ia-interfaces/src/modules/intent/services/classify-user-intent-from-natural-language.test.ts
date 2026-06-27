import { describe, it, expect } from "vitest";
import { z } from "zod";
import { classifyUserIntentFromNaturalLanguage } from "./classify-user-intent-from-natural-language";
import { IntentClassificationFailedError } from "@/core/errors/dynamic-interface-error";
import type { IntentRoutingConfiguration } from "../types/intent-routing-configuration";

const mockToolDefinition = {
  toolName: "get_weather",
  toolDescription: "Get weather for a location",
  inputValidationSchema: z.object({ city: z.string() }),
  outputValidationSchema: z.object({ temperature: z.number() }),
  requiresUserApproval: false,
  executeToolAction: async () => ({ temperature: 22 }),
};

const testRoutingConfiguration: IntentRoutingConfiguration = {
  registeredIntentRoutes: [
    {
      intentIdentifier: "weather-lookup",
      intentDescription: "Check the weather for a location",
      exampleUserUtterances: [
        "what's the weather like",
        "show me the forecast",
        "temperature in",
      ],
      associatedToolDefinition: mockToolDefinition,
    },
  ],
  confidenceThresholdForDirectRouting: 0.85,
  confidenceThresholdForLlmValidation: 0.5,
  maximumClarificationAttempts: 3,
};

describe("classifyUserIntentFromNaturalLanguage", () => {
  it("classifies with high confidence when similarity score exceeds direct routing threshold", async () => {
    const mockSimilarityScorer = async () => 0.92;

    const result = await classifyUserIntentFromNaturalLanguage(
      "what's the weather in Tokyo",
      testRoutingConfiguration,
      mockSimilarityScorer,
    );

    expect(result.confidenceLevel).toBe("high");
    expect(result.intentIdentifier).toBe("weather-lookup");
    expect(result.matchedToolName).toBe("get_weather");
    expect(result.requiresClarification).toBe(false);
  });

  it("classifies with medium confidence between thresholds", async () => {
    const mockSimilarityScorer = async () => 0.65;

    const result = await classifyUserIntentFromNaturalLanguage(
      "is it going to rain tomorrow",
      testRoutingConfiguration,
      mockSimilarityScorer,
    );

    expect(result.confidenceLevel).toBe("medium");
    expect(result.matchedToolName).toBe("get_weather");
    expect(result.requiresClarification).toBe(false);
  });

  it("requires clarification when score is below validation threshold", async () => {
    const mockSimilarityScorer = async () => 0.3;

    const result = await classifyUserIntentFromNaturalLanguage(
      "tell me something interesting",
      testRoutingConfiguration,
      mockSimilarityScorer,
    );

    expect(result.confidenceLevel).toBe("low");
    expect(result.matchedToolName).toBeNull();
    expect(result.requiresClarification).toBe(true);
    expect(result.clarificationQuestion).toBeTruthy();
  });

  it("throws IntentClassificationFailedError for empty input", async () => {
    const mockSimilarityScorer = async () => 0;

    await expect(
      classifyUserIntentFromNaturalLanguage(
        "  ",
        testRoutingConfiguration,
        mockSimilarityScorer,
      ),
    ).rejects.toThrow(IntentClassificationFailedError);
  });

  it("returns unknown intent when no routes are configured", async () => {
    const emptyConfiguration: IntentRoutingConfiguration = {
      registeredIntentRoutes: [],
      confidenceThresholdForDirectRouting: 0.85,
      confidenceThresholdForLlmValidation: 0.5,
      maximumClarificationAttempts: 3,
    };
    const mockSimilarityScorer = async () => 0;

    const result = await classifyUserIntentFromNaturalLanguage(
      "do something",
      emptyConfiguration,
      mockSimilarityScorer,
    );

    expect(result.intentIdentifier).toBe("unknown");
    expect(result.requiresClarification).toBe(true);
  });

  it("preserves raw user input in classification result", async () => {
    const mockSimilarityScorer = async () => 0.9;
    const originalInput = "What's the weather like in São Paulo?";

    const result = await classifyUserIntentFromNaturalLanguage(
      originalInput,
      testRoutingConfiguration,
      mockSimilarityScorer,
    );

    expect(result.rawUserInput).toBe(originalInput);
  });
});
