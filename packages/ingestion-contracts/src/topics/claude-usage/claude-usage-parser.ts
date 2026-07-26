import { requireNonNegativeNumber } from "../../field-parsers/number-field-parsers";
import {
  asObjectRecord,
  rejectUnknownKeys,
  requireArray,
} from "../../field-parsers/record-shape-field-parsers";
import {
  requireTimestamp,
  requireUrlSafeLabel,
} from "../../field-parsers/text-field-parsers";
import { IngestionContractViolationError } from "../../ingestion-types";
import {
  parseClaudeUsageActivitySummary,
  parseClaudeUsageModelTotals,
} from "./claude-usage-section-parsers";
import type {
  ClaudeUsageModelTotals,
  ClaudeUsagePayload,
} from "./claude-usage-types";

const PAYLOAD_CONTEXT = "claude-usage payload";

const COST_ROUNDING_TOLERANCE = 0.005 + 1e-9;

function assertModelsAreDistinct(
  models: readonly ClaudeUsageModelTotals[],
): void {
  const seen = new Set<string>();
  for (const entry of models) {
    if (seen.has(entry.model)) {
      throw new IngestionContractViolationError(
        `${PAYLOAD_CONTEXT} reports the model ${entry.model} more than once`,
      );
    }
    seen.add(entry.model);
  }
}

function assertModelCostsAccountForTotal(
  models: readonly ClaudeUsageModelTotals[],
  totalCostUsd: number,
): void {
  const modelCost = models.reduce((total, entry) => total + entry.costUsd, 0);
  if (Math.abs(modelCost - totalCostUsd) > COST_ROUNDING_TOLERANCE) {
    throw new IngestionContractViolationError(
      `${PAYLOAD_CONTEXT} field totalCostUsd reports ${totalCostUsd} but the per model costs add up to ${modelCost}`,
    );
  }
}

export function parseClaudeUsagePayload(value: unknown): ClaudeUsagePayload {
  const record = asObjectRecord(value, PAYLOAD_CONTEXT);
  rejectUnknownKeys(
    record,
    [
      "recordedAt",
      "accountLabel",
      "machineLabel",
      "models",
      "totalCostUsd",
      "activity",
    ],
    PAYLOAD_CONTEXT,
  );

  const recordedAt = requireTimestamp(record, "recordedAt", PAYLOAD_CONTEXT);
  const accountLabel = requireUrlSafeLabel(
    record,
    "accountLabel",
    PAYLOAD_CONTEXT,
  );
  const machineLabel = requireUrlSafeLabel(
    record,
    "machineLabel",
    PAYLOAD_CONTEXT,
  );
  const totalCostUsd = requireNonNegativeNumber(
    record,
    "totalCostUsd",
    PAYLOAD_CONTEXT,
  );
  const models = requireArray(record, "models", PAYLOAD_CONTEXT).map(
    (entry, index) =>
      parseClaudeUsageModelTotals(entry, index, PAYLOAD_CONTEXT),
  );
  const activity = parseClaudeUsageActivitySummary(
    record["activity"],
    PAYLOAD_CONTEXT,
  );

  assertModelsAreDistinct(models);
  assertModelCostsAccountForTotal(models, totalCostUsd);

  return {
    recordedAt,
    accountLabel,
    machineLabel,
    models,
    totalCostUsd,
    activity,
  };
}
