import {
  requireNonNegativeInteger,
  requireNonNegativeNumber,
} from "../../field-parsers/number-field-parsers";
import {
  asObjectRecord,
  rejectUnknownKeys,
} from "../../field-parsers/record-shape-field-parsers";
import { requireString } from "../../field-parsers/text-field-parsers";
import { IngestionContractViolationError } from "../../ingestion-types";
import type {
  ClaudeUsageActivitySummary,
  ClaudeUsageModelTotals,
} from "./claude-usage-types";

export function parseClaudeUsageModelTotals(
  value: unknown,
  index: number,
  payloadContext: string,
): ClaudeUsageModelTotals {
  const indexedContext = `${payloadContext} model ${index}`;
  const record = asObjectRecord(value, indexedContext);
  const model = requireString(record, "model", indexedContext);
  const context = `${payloadContext} model ${model}`;
  rejectUnknownKeys(
    record,
    [
      "model",
      "inputTokens",
      "outputTokens",
      "cacheReadInputTokens",
      "cacheCreationInputTokens",
      "costUsd",
    ],
    context,
  );

  return {
    model,
    inputTokens: requireNonNegativeInteger(record, "inputTokens", context),
    outputTokens: requireNonNegativeInteger(record, "outputTokens", context),
    cacheReadInputTokens: requireNonNegativeInteger(
      record,
      "cacheReadInputTokens",
      context,
    ),
    cacheCreationInputTokens: requireNonNegativeInteger(
      record,
      "cacheCreationInputTokens",
      context,
    ),
    costUsd: requireNonNegativeNumber(record, "costUsd", context),
  };
}

export function parseClaudeUsageActivitySummary(
  value: unknown,
  payloadContext: string,
): ClaudeUsageActivitySummary {
  const context = `${payloadContext} activity`;
  const record = asObjectRecord(value, context);
  rejectUnknownKeys(
    record,
    ["activeDayCount", "messageCount", "sessionCount", "toolCallCount"],
    context,
  );

  const activeDayCount = requireNonNegativeInteger(
    record,
    "activeDayCount",
    context,
  );
  const messageCount = requireNonNegativeInteger(
    record,
    "messageCount",
    context,
  );
  const sessionCount = requireNonNegativeInteger(
    record,
    "sessionCount",
    context,
  );
  const toolCallCount = requireNonNegativeInteger(
    record,
    "toolCallCount",
    context,
  );

  if (activeDayCount === 0 && messageCount + sessionCount + toolCallCount > 0) {
    throw new IngestionContractViolationError(
      `${context} field activeDayCount is zero while the snapshot still reports messages, sessions, or tool calls`,
    );
  }

  return { activeDayCount, messageCount, sessionCount, toolCallCount };
}
