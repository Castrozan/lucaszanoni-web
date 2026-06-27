import type { IntentClassificationResult } from "@/core/types/intent-classification-result";
import type { IntentRoutingConfiguration } from "../types/intent-routing-configuration";
import { classifyUserIntentFromNaturalLanguage } from "./classify-user-intent-from-natural-language";

export interface IntentClarificationDialogState {
  readonly originalClassification: IntentClassificationResult;
  readonly clarificationAttemptsCount: number;
  readonly isResolved: boolean;
  readonly resolvedClassification: IntentClassificationResult | null;
}

export function createInitialClarificationDialogState(
  originalClassification: IntentClassificationResult,
): IntentClarificationDialogState {
  return {
    originalClassification,
    clarificationAttemptsCount: 0,
    isResolved: !originalClassification.requiresClarification,
    resolvedClassification: originalClassification.requiresClarification
      ? null
      : originalClassification,
  };
}

export async function processUserClarificationResponse(
  currentDialogState: IntentClarificationDialogState,
  userClarificationInput: string,
  routingConfiguration: IntentRoutingConfiguration,
  computeSemanticSimilarityScore: (
    userInput: string,
    exampleUtterances: readonly string[],
  ) => Promise<number>,
): Promise<IntentClarificationDialogState> {
  const newAttemptsCount = currentDialogState.clarificationAttemptsCount + 1;

  if (newAttemptsCount >= routingConfiguration.maximumClarificationAttempts) {
    return {
      ...currentDialogState,
      clarificationAttemptsCount: newAttemptsCount,
      isResolved: true,
      resolvedClassification: null,
    };
  }

  const reclassifiedIntent = await classifyUserIntentFromNaturalLanguage(
    userClarificationInput,
    routingConfiguration,
    computeSemanticSimilarityScore,
  );

  if (!reclassifiedIntent.requiresClarification) {
    return {
      ...currentDialogState,
      clarificationAttemptsCount: newAttemptsCount,
      isResolved: true,
      resolvedClassification: reclassifiedIntent,
    };
  }

  return {
    ...currentDialogState,
    clarificationAttemptsCount: newAttemptsCount,
    isResolved: false,
    resolvedClassification: null,
  };
}
