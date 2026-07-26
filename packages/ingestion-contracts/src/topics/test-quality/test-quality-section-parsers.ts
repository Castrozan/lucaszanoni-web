import {
  URL_SAFE_LABEL_PATTERN,
  asObjectRecord,
  rejectUnknownKeys,
  requireNonEmptyArray,
  requireNonNegativeInteger,
  requirePositiveInteger,
  requireString,
  requireTimestamp,
  requireUnitInterval,
} from "../../ingestion-field-parsers";
import { IngestionContractViolationError } from "../../ingestion-types";
import type {
  TestQualityCoreRuleSummary,
  TestQualityHookSummary,
  TestQualityStaticEvalSummary,
} from "./test-quality-types";

const PASS_RATE_ROUNDING_TOLERANCE = 0.00005 + 1e-9;

export function parseStaticEvalSummary(
  value: unknown,
  context: string,
): TestQualityStaticEvalSummary {
  const record = asObjectRecord(value, context);
  rejectUnknownKeys(
    record,
    [
      "totalTests",
      "passedTests",
      "passRate",
      "suiteCount",
      "categoryCount",
      "recordedAt",
      "recordedCommit",
    ],
    context,
  );

  const totalTests = requirePositiveInteger(record, "totalTests", context);
  const passedTests = requireNonNegativeInteger(record, "passedTests", context);
  const passRate = requireUnitInterval(record, "passRate", context);
  const suiteCount = requirePositiveInteger(record, "suiteCount", context);
  const categoryCount = requirePositiveInteger(
    record,
    "categoryCount",
    context,
  );
  const recordedAt = requireTimestamp(record, "recordedAt", context);
  const recordedCommit = requireString(record, "recordedCommit", context);

  if (passedTests > totalTests) {
    throw new IngestionContractViolationError(
      `${context} field passedTests may not exceed totalTests`,
    );
  }

  if (
    Math.abs(passRate - passedTests / totalTests) > PASS_RATE_ROUNDING_TOLERANCE
  ) {
    throw new IngestionContractViolationError(
      `${context} field passRate does not match the ratio of passedTests to totalTests`,
    );
  }

  return {
    totalTests,
    passedTests,
    passRate,
    suiteCount,
    categoryCount,
    recordedAt,
    recordedCommit,
  };
}

export function parseCoreRuleSummary(
  value: unknown,
  context: string,
): TestQualityCoreRuleSummary {
  const record = asObjectRecord(value, context);
  rejectUnknownKeys(record, ["lineCount", "ruleBlockCount"], context);

  const lineCount = requirePositiveInteger(record, "lineCount", context);
  const ruleBlockCount = requireNonNegativeInteger(
    record,
    "ruleBlockCount",
    context,
  );

  if (ruleBlockCount > lineCount) {
    throw new IngestionContractViolationError(
      `${context} field ruleBlockCount may not exceed the lineCount of the rules file`,
    );
  }

  return { lineCount, ruleBlockCount };
}

function requireWiredEventLabels(
  events: readonly unknown[],
  context: string,
): readonly string[] {
  return events.map((event) => {
    if (typeof event !== "string" || !URL_SAFE_LABEL_PATTERN.test(event)) {
      throw new IngestionContractViolationError(
        `${context} field wiredEvents must hold lowercase hyphenated hook event names`,
      );
    }
    return event;
  });
}

function assertWiredEventsAreDistinct(
  events: readonly string[],
  context: string,
): void {
  const seen = new Set<string>();
  for (const event of events) {
    if (seen.has(event)) {
      throw new IngestionContractViolationError(
        `${context} wires the hook event ${event} more than once`,
      );
    }
    seen.add(event);
  }
}

export function parseHookSummary(
  value: unknown,
  context: string,
): TestQualityHookSummary {
  const record = asObjectRecord(value, context);
  rejectUnknownKeys(record, ["wiredEvents", "entryPointCount"], context);

  const declaredEvents = requireNonEmptyArray(record, "wiredEvents", context);
  const entryPointCount = requirePositiveInteger(
    record,
    "entryPointCount",
    context,
  );

  if (entryPointCount < declaredEvents.length) {
    throw new IngestionContractViolationError(
      `${context} field entryPointCount may not be smaller than the number of wired hook events`,
    );
  }

  const wiredEvents = requireWiredEventLabels(declaredEvents, context);
  assertWiredEventsAreDistinct(wiredEvents, context);

  return { wiredEvents, entryPointCount };
}
