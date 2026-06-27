import type { IntentClassificationResult } from "@/core/types/intent-classification-result";
import type { ToolDefinitionWithSchema } from "@/core/types/tool-definition-with-schema";
import type { IntentRoutingConfiguration } from "../types/intent-routing-configuration";

export function mapClassifiedIntentToToolDefinition(
  classificationResult: IntentClassificationResult,
  routingConfiguration: IntentRoutingConfiguration,
): ToolDefinitionWithSchema | null {
  if (classificationResult.requiresClarification) {
    return null;
  }

  if (!classificationResult.matchedToolName) {
    return null;
  }

  const matchingRoute = routingConfiguration.registeredIntentRoutes.find(
    (route) =>
      route.associatedToolDefinition.toolName ===
      classificationResult.matchedToolName,
  );

  return matchingRoute?.associatedToolDefinition ?? null;
}
