export type AgentUserInteractionEvent =
  | AgentRunLifecycleEvent
  | AgentTextMessageEvent
  | AgentToolCallEvent
  | AgentStateManagementEvent;

export interface AgentRunLifecycleEvent {
  readonly eventCategory: "lifecycle";
  readonly eventType: "run-started" | "run-finished" | "run-error";
  readonly runIdentifier: string;
  readonly timestamp: number;
  readonly errorMessage?: string;
}

export interface AgentTextMessageEvent {
  readonly eventCategory: "text-message";
  readonly eventType: "message-start" | "message-content" | "message-end";
  readonly messageIdentifier: string;
  readonly textContentDelta?: string;
  readonly timestamp: number;
}

export interface AgentToolCallEvent {
  readonly eventCategory: "tool-call";
  readonly eventType: "call-start" | "call-args" | "call-end" | "call-result";
  readonly toolCallIdentifier: string;
  readonly toolName: string;
  readonly argumentsDelta?: string;
  readonly resultData?: Record<string, unknown>;
  readonly timestamp: number;
}

export interface AgentStateManagementEvent {
  readonly eventCategory: "state-management";
  readonly eventType: "state-snapshot" | "state-delta";
  readonly statePayload: Record<string, unknown>;
  readonly timestamp: number;
}
