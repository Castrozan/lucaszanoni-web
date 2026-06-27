export type IntentConfidenceLevel = "high" | "medium" | "low";

export interface IntentClassificationResult {
  readonly intentIdentifier: string;
  readonly confidenceLevel: IntentConfidenceLevel;
  readonly confidenceScore: number;
  readonly matchedToolName: string | null;
  readonly requiresClarification: boolean;
  readonly clarificationQuestion: string | null;
  readonly rawUserInput: string;
}
