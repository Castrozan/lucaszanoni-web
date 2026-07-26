import {
  requireNonNegativeInteger,
  requirePositiveInteger,
  requireUnitInterval,
} from "../../field-parsers/number-field-parsers";
import {
  asObjectRecord,
  rejectUnknownKeys,
} from "../../field-parsers/record-shape-field-parsers";
import { requireString } from "../../field-parsers/text-field-parsers";
import { IngestionContractViolationError } from "../../ingestion-types";
import type { TestCoverageFileResult } from "./test-coverage-types";

const REPOSITORY_RELATIVE_PATH_PATTERN =
  /^[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*$/;

const COVERAGE_RATE_ROUNDING_TOLERANCE = 0.00005 + 1e-9;

export function assertCoverageRateMatchesLineCounts(
  lineCoverageRate: number,
  coveredLines: number,
  measurableLines: number,
  context: string,
): void {
  if (
    Math.abs(lineCoverageRate - coveredLines / measurableLines) >
    COVERAGE_RATE_ROUNDING_TOLERANCE
  ) {
    throw new IngestionContractViolationError(
      `${context} field lineCoverageRate does not match the ratio of coveredLines to measurableLines`,
    );
  }
}

function requireRepositoryRelativePath(
  record: Record<string, unknown>,
  context: string,
): string {
  const path = requireString(record, "path", context);
  if (
    !REPOSITORY_RELATIVE_PATH_PATTERN.test(path) ||
    path.split("/").includes("..")
  ) {
    throw new IngestionContractViolationError(
      `${context} field path must be a repository relative path that does not escape the repository`,
    );
  }
  return path;
}

export function parseTestCoverageFileResult(
  value: unknown,
  index: number,
  payloadContext: string,
): TestCoverageFileResult {
  const record = asObjectRecord(value, `${payloadContext} file ${index}`);
  const path = requireRepositoryRelativePath(
    record,
    `${payloadContext} file ${index}`,
  );
  const context = `${payloadContext} file ${path}`;
  rejectUnknownKeys(
    record,
    ["path", "coveredLines", "measurableLines", "lineCoverageRate"],
    context,
  );
  const measurableLines = requirePositiveInteger(
    record,
    "measurableLines",
    context,
  );
  const coveredLines = requireNonNegativeInteger(
    record,
    "coveredLines",
    context,
  );
  const lineCoverageRate = requireUnitInterval(
    record,
    "lineCoverageRate",
    context,
  );

  if (coveredLines > measurableLines) {
    throw new IngestionContractViolationError(
      `${context} reports ${coveredLines} coveredLines out of ${measurableLines} measurable lines`,
    );
  }

  assertCoverageRateMatchesLineCounts(
    lineCoverageRate,
    coveredLines,
    measurableLines,
    context,
  );

  return { path, coveredLines, measurableLines, lineCoverageRate };
}
