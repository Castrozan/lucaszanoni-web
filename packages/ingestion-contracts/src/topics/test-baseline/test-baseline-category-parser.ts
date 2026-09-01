import { requireBoolean } from "../../field-parsers/boolean-field-parsers";
import { requireNonNegativeInteger } from "../../field-parsers/number-field-parsers";
import {
  asObjectRecord,
  rejectUnknownKeys,
  requireNonEmptyArray,
} from "../../field-parsers/record-shape-field-parsers";
import { requireString } from "../../field-parsers/text-field-parsers";
import { IngestionContractViolationError } from "../../ingestion-types";
import {
  parseTestEvidence,
  TEST_EVIDENCE_KEYS,
} from "./test-baseline-evidence-parser";
import type {
  TestBaselineCategoryResult,
  TestBaselineTestResult,
} from "./test-baseline-types";

const PAYLOAD_CONTEXT = "dotfiles-test-baseline payload";

const CATEGORY_LABEL_PATTERN = /^[a-z0-9][a-z0-9_/-]*$/;

function requireCategoryLabel(
  record: Record<string, unknown>,
  context: string,
): string {
  const category = requireString(record, "category", context);
  if (!CATEGORY_LABEL_PATTERN.test(category)) {
    throw new IngestionContractViolationError(
      `${context} field category must be lowercase letters, digits, underscores, hyphens, and slashes`,
    );
  }
  return category;
}

function parseTestResult(
  value: unknown,
  context: string,
): TestBaselineTestResult {
  const record = asObjectRecord(value, context);
  rejectUnknownKeys(record, ["name", "passed", ...TEST_EVIDENCE_KEYS], context);
  return {
    name: requireString(record, "name", context),
    passed: requireBoolean(record, "passed", context),
    ...parseTestEvidence(record, context),
  };
}

export function parseCategoryResult(
  value: unknown,
): TestBaselineCategoryResult {
  const record = asObjectRecord(value, `${PAYLOAD_CONTEXT} category`);
  const category = requireCategoryLabel(record, `${PAYLOAD_CONTEXT} category`);
  const context = `${PAYLOAD_CONTEXT} category ${category}`;
  rejectUnknownKeys(record, ["category", "passed", "failed", "tests"], context);
  const passed = requireNonNegativeInteger(record, "passed", context);
  const failed = requireNonNegativeInteger(record, "failed", context);
  const tests = requireNonEmptyArray(record, "tests", context).map(
    (entry, index) => parseTestResult(entry, `${context} test ${index}`),
  );

  if (passed + failed !== tests.length) {
    throw new IngestionContractViolationError(
      `${context} reports ${passed} passed and ${failed} failed but lists ${tests.length} tests`,
    );
  }

  const observedPassed = tests.filter((entry) => entry.passed).length;
  if (observedPassed !== passed) {
    throw new IngestionContractViolationError(
      `${context} reports ${passed} passed but ${observedPassed} of its listed tests passed`,
    );
  }

  return { category, passed, failed, tests };
}
