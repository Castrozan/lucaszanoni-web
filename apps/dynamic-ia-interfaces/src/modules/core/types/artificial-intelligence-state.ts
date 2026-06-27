export type ArtificialIntelligenceStateMessageRole =
  | "system"
  | "user"
  | "assistant"
  | "tool";

export interface ArtificialIntelligenceStateMessage {
  readonly messageRole: ArtificialIntelligenceStateMessageRole;
  readonly messageContent: string;
  readonly toolCallIdentifier?: string;
  readonly toolName?: string;
}

export type ArtificialIntelligenceState =
  readonly ArtificialIntelligenceStateMessage[];
