import {
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
  TestCoverageFileResult,
  TestCoveragePayload,
} from "./test-coverage-types";

const PAYLOAD_CONTEXT = "dotfiles-test-coverage payload";

const REPOSITORY_RELATIVE_PATH_PATTERN =
  /^[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*$/;

const COVERAGE_RATE_ROUNDING_TOLERANCE = 0.00005 + 1e-9;

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

function assertRateMatchesLineCounts(
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

function parseFileResult(
  value: unknown,
  index: number,
): TestCoverageFileResult {
  const record = asObjectRecord(value, `${PAYLOAD_CONTEXT} file ${index}`);
  const path = requireRepositoryRelativePath(
    record,
    `${PAYLOAD_CONTEXT} file ${index}`,
  );
  const context = `${PAYLOAD_CONTEXT} file ${path}`;
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

  assertRateMatchesLineCounts(
    lineCoverageRate,
    coveredLines,
    measurableLines,
    context,
  );

  return { path, coveredLines, measurableLines, lineCoverageRate };
}

function assertFilesAreDistinct(
  files: readonly TestCoverageFileResult[],
): void {
  const seen = new Set<string>();
  for (const entry of files) {
    if (seen.has(entry.path)) {
      throw new IngestionContractViolationError(
        `${PAYLOAD_CONTEXT} measures the file ${entry.path} more than once`,
      );
    }
    seen.add(entry.path);
  }
}

function assertFilesAccountForTotals(
  files: readonly TestCoverageFileResult[],
  coveredLines: number,
  measurableLines: number,
): void {
  const fileCovered = files.reduce(
    (total, entry) => total + entry.coveredLines,
    0,
  );
  const fileMeasurable = files.reduce(
    (total, entry) => total + entry.measurableLines,
    0,
  );
  if (fileCovered !== coveredLines || fileMeasurable !== measurableLines) {
    throw new IngestionContractViolationError(
      `${PAYLOAD_CONTEXT} files account for ${fileCovered} covered of ${fileMeasurable} measurable lines but the run reports ${coveredLines} of ${measurableLines}`,
    );
  }
}

export function parseTestCoveragePayload(value: unknown): TestCoveragePayload {
  const record = asObjectRecord(value, PAYLOAD_CONTEXT);
  rejectUnknownKeys(
    record,
    [
      "recordedAt",
      "commit",
      "coveredLines",
      "measurableLines",
      "lineCoverageRate",
      "files",
    ],
    PAYLOAD_CONTEXT,
  );

  const recordedAt = requireTimestamp(record, "recordedAt", PAYLOAD_CONTEXT);
  const commit = requireString(record, "commit", PAYLOAD_CONTEXT);
  const measurableLines = requirePositiveInteger(
    record,
    "measurableLines",
    PAYLOAD_CONTEXT,
  );
  const coveredLines = requireNonNegativeInteger(
    record,
    "coveredLines",
    PAYLOAD_CONTEXT,
  );
  const lineCoverageRate = requireUnitInterval(
    record,
    "lineCoverageRate",
    PAYLOAD_CONTEXT,
  );

  if (coveredLines > measurableLines) {
    throw new IngestionContractViolationError(
      `${PAYLOAD_CONTEXT} field coveredLines may not exceed measurableLines`,
    );
  }

  assertRateMatchesLineCounts(
    lineCoverageRate,
    coveredLines,
    measurableLines,
    PAYLOAD_CONTEXT,
  );

  const files = requireNonEmptyArray(record, "files", PAYLOAD_CONTEXT).map(
    parseFileResult,
  );

  assertFilesAreDistinct(files);
  assertFilesAccountForTotals(files, coveredLines, measurableLines);

  return {
    recordedAt,
    commit,
    coveredLines,
    measurableLines,
    lineCoverageRate,
    files,
  };
}
