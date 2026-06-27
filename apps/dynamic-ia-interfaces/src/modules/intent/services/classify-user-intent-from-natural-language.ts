import type { IntentClassificationResult } from "@/core/types/intent-classification-result";
import type { IntentRoutingConfiguration } from "../types/intent-routing-configuration";
import { IntentClassificationFailedError } from "@/core/errors/dynamic-interface-error";

export async function classifyUserIntentFromNaturalLanguage(
  rawUserInput: string,
  routingConfiguration: IntentRoutingConfiguration,
  computeSemanticSimilarityScore: (
    userInput: string,
    exampleUtterances: readonly string[],
  ) => Promise<number>,
): Promise<IntentClassificationResult> {
  if (!rawUserInput.trim()) {
    throw new IntentClassificationFailedError(rawUserInput, "Empty input");
  }

  const scoredIntentRoutes = await Promise.all(
    routingConfiguration.registeredIntentRoutes.map(async (route) => ({
      route,
      similarityScore: await computeSemanticSimilarityScore(
        rawUserInput,
        route.exampleUserUtterances,
      ),
    })),
  );

  const sortedByDescendingScore = scoredIntentRoutes.sort(
    (first, second) => second.similarityScore - first.similarityScore,
  );

  const bestMatchingRoute = sortedByDescendingScore[0];

  if (!bestMatchingRoute) {
    return {
      intentIdentifier: "unknown",
      confidenceLevel: "low",
      confidenceScore: 0,
      matchedToolName: null,
      requiresClarification: true,
      clarificationQuestion:
        "I'm not sure what you'd like to do. Could you describe what you're looking for?",
      rawUserInput,
    };
  }

  const confidenceLevel = determineConfidenceLevelFromScore(
    bestMatchingRoute.similarityScore,
    routingConfiguration,
  );

  return {
    intentIdentifier: bestMatchingRoute.route.intentIdentifier,
    confidenceLevel,
    confidenceScore: bestMatchingRoute.similarityScore,
    matchedToolName:
      confidenceLevel === "low"
        ? null
        : bestMatchingRoute.route.associatedToolDefinition.toolName,
    requiresClarification: confidenceLevel === "low",
    clarificationQuestion:
      confidenceLevel === "low"
        ? `Did you mean "${bestMatchingRoute.route.intentDescription}"?`
        : null,
    rawUserInput,
  };
}

function determineConfidenceLevelFromScore(
  score: number,
  configuration: IntentRoutingConfiguration,
): IntentClassificationResult["confidenceLevel"] {
  if (score >= configuration.confidenceThresholdForDirectRouting) {
    return "high";
  }
  if (score >= configuration.confidenceThresholdForLlmValidation) {
    return "medium";
  }
  return "low";
}
