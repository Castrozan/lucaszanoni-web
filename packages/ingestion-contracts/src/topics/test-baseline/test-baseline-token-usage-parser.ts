import { requireNonNegativeInteger } from "../../field-parsers/number-field-parsers";
import {
  asObjectRecord,
  rejectUnknownKeys,
} from "../../field-parsers/record-shape-field-parsers";
import { URL_SAFE_LABEL_PATTERN } from "../../field-parsers/text-field-parsers";
import { IngestionContractViolationError } from "../../ingestion-types";
import type {
  TestBaselineProviderUsage,
  TestBaselineTokenUsage,
} from "./test-baseline-types";

function parseProviderUsage(
  value: unknown,
  context: string,
): TestBaselineProviderUsage {
  const record = asObjectRecord(value, context);
  rejectUnknownKeys(
    record,
    [
      "invocations",
      "measuredInvocations",
      "inputTokens",
      "cachedInputTokens",
      "cacheWriteInputTokens",
      "outputTokens",
      "reasoningOutputTokens",
    ],
    context,
  );
  const invocations = requireNonNegativeInteger(record, "invocations", context);
  const measuredInvocations = requireNonNegativeInteger(
    record,
    "measuredInvocations",
    context,
  );
  if (measuredInvocations > invocations) {
    throw new IngestionContractViolationError(
      `${context} cannot measure more invocations than it reports`,
    );
  }
  return {
    invocations,
    measuredInvocations,
    inputTokens: requireNonNegativeInteger(record, "inputTokens", context),
    cachedInputTokens: requireNonNegativeInteger(
      record,
      "cachedInputTokens",
      context,
    ),
    cacheWriteInputTokens: requireNonNegativeInteger(
      record,
      "cacheWriteInputTokens",
      context,
    ),
    outputTokens: requireNonNegativeInteger(record, "outputTokens", context),
    reasoningOutputTokens: requireNonNegativeInteger(
      record,
      "reasoningOutputTokens",
      context,
    ),
  };
}

function parseRoleUsage(value: unknown, context: string) {
  const record = asObjectRecord(value, context);
  return Object.fromEntries(
    Object.entries(record).map(([harness, usage]) => {
      if (!URL_SAFE_LABEL_PATTERN.test(harness)) {
        throw new IngestionContractViolationError(
          `${context} harness ${harness} must be a url safe label`,
        );
      }
      return [harness, parseProviderUsage(usage, `${context} ${harness}`)];
    }),
  );
}

export function parseTokenUsage(
  value: unknown,
  context: string,
): TestBaselineTokenUsage {
  const record = asObjectRecord(value, context);
  rejectUnknownKeys(record, ["subject", "judge"], context);
  return Object.fromEntries(
    Object.entries(record).map(([role, usage]) => [
      role,
      parseRoleUsage(usage, `${context} ${role}`),
    ]),
  );
}
