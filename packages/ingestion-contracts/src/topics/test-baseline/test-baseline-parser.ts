import {
  requireNonNegativeInteger,
  requirePositiveInteger,
  requireUnitInterval,
} from "../../field-parsers/number-field-parsers";
import {
  asObjectRecord,
  rejectUnknownKeys,
  requireNonEmptyArray,
} from "../../field-parsers/record-shape-field-parsers";
import {
  requireString,
  requireTimestamp,
} from "../../field-parsers/text-field-parsers";
import { IngestionContractViolationError } from "../../ingestion-types";
import { parseCategoryResult } from "./test-baseline-category-parser";
import {
  parsePayloadEvidence,
  PAYLOAD_EVIDENCE_KEYS,
} from "./test-baseline-evidence-parser";
import type {
  TestBaselineCategoryResult,
  TestBaselinePayload,
} from "./test-baseline-types";

const PAYLOAD_CONTEXT = "dotfiles-test-baseline payload";

const PASS_RATE_ROUNDING_TOLERANCE = 0.00005 + 1e-9;

function assertCategoriesAreDistinct(
  categories: readonly TestBaselineCategoryResult[],
): void {
  const seen = new Set<string>();
  for (const entry of categories) {
    if (seen.has(entry.category)) {
      throw new IngestionContractViolationError(
        `${PAYLOAD_CONTEXT} reports the category ${entry.category} more than once`,
      );
    }
    seen.add(entry.category);
  }
}

function assertCategoriesAccountForTotals(
  categories: readonly TestBaselineCategoryResult[],
  passedTests: number,
  failedTests: number,
): void {
  const categoryPassed = categories.reduce(
    (total, entry) => total + entry.passed,
    0,
  );
  const categoryFailed = categories.reduce(
    (total, entry) => total + entry.failed,
    0,
  );
  if (categoryPassed !== passedTests || categoryFailed !== failedTests) {
    throw new IngestionContractViolationError(
      `${PAYLOAD_CONTEXT} categories account for ${categoryPassed} passed and ${categoryFailed} failed but the run reports ${passedTests} passed and ${failedTests} failed`,
    );
  }
}

export function parseTestBaselinePayload(value: unknown): TestBaselinePayload {
  const record = asObjectRecord(value, PAYLOAD_CONTEXT);
  rejectUnknownKeys(
    record,
    [
      "recordedAt",
      "commit",
      "totalTests",
      "passedTests",
      "failedTests",
      "passRate",
      ...PAYLOAD_EVIDENCE_KEYS,
      "categories",
    ],
    PAYLOAD_CONTEXT,
  );

  const recordedAt = requireTimestamp(record, "recordedAt", PAYLOAD_CONTEXT);
  const commit = requireString(record, "commit", PAYLOAD_CONTEXT);
  const totalTests = requirePositiveInteger(
    record,
    "totalTests",
    PAYLOAD_CONTEXT,
  );
  const passedTests = requireNonNegativeInteger(
    record,
    "passedTests",
    PAYLOAD_CONTEXT,
  );
  const failedTests = requireNonNegativeInteger(
    record,
    "failedTests",
    PAYLOAD_CONTEXT,
  );
  const passRate = requireUnitInterval(record, "passRate", PAYLOAD_CONTEXT);

  if (passedTests + failedTests !== totalTests) {
    throw new IngestionContractViolationError(
      `${PAYLOAD_CONTEXT} fields passedTests and failedTests must sum to totalTests`,
    );
  }

  if (
    Math.abs(passRate - passedTests / totalTests) > PASS_RATE_ROUNDING_TOLERANCE
  ) {
    throw new IngestionContractViolationError(
      `${PAYLOAD_CONTEXT} field passRate does not match the ratio of passedTests to totalTests`,
    );
  }

  const categories = requireNonEmptyArray(
    record,
    "categories",
    PAYLOAD_CONTEXT,
  ).map(parseCategoryResult);

  assertCategoriesAreDistinct(categories);
  assertCategoriesAccountForTotals(categories, passedTests, failedTests);

  return {
    recordedAt,
    commit,
    totalTests,
    passedTests,
    failedTests,
    passRate,
    ...parsePayloadEvidence(record),
    categories,
  };
}
