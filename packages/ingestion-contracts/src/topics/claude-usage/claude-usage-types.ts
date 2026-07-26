export const CLAUDE_USAGE_TOPIC = "claude-usage";

export const CLAUDE_USAGE_SCHEMA_VERSION = 1;

export interface ClaudeUsageModelTotals {
  readonly model: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly cacheReadInputTokens: number;
  readonly cacheCreationInputTokens: number;
  readonly costUsd: number;
}

export interface ClaudeUsageActivitySummary {
  readonly activeDayCount: number;
  readonly messageCount: number;
  readonly sessionCount: number;
  readonly toolCallCount: number;
}

export interface ClaudeUsagePayload {
  readonly recordedAt: string;
  readonly accountLabel: string;
  readonly machineLabel: string;
  readonly models: readonly ClaudeUsageModelTotals[];
  readonly totalCostUsd: number;
  readonly activity: ClaudeUsageActivitySummary;
}
