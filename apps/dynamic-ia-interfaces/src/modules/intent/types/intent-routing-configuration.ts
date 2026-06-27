import type { ToolDefinitionWithSchema } from "@/core/types/tool-definition-with-schema";

export interface IntentRoutingConfiguration {
  readonly registeredIntentRoutes: readonly IntentRouteDefinition[];
  readonly confidenceThresholdForDirectRouting: number;
  readonly confidenceThresholdForLlmValidation: number;
  readonly maximumClarificationAttempts: number;
}

export interface IntentRouteDefinition {
  readonly intentIdentifier: string;
  readonly intentDescription: string;
  readonly exampleUserUtterances: readonly string[];
  readonly associatedToolDefinition: ToolDefinitionWithSchema;
}

export const DEFAULT_INTENT_ROUTING_CONFIGURATION: IntentRoutingConfiguration = {
  registeredIntentRoutes: [],
  confidenceThresholdForDirectRouting: 0.85,
  confidenceThresholdForLlmValidation: 0.5,
  maximumClarificationAttempts: 3,
};
