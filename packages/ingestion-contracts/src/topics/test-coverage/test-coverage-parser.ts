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
import {
  assertCoverageRateMatchesLineCounts,
  parseTestCoverageFileResult,
} from "./test-coverage-file-parser";
import type {
  TestCoverageFileResult,
  TestCoveragePayload,
} from "./test-coverage-types";

const PAYLOAD_CONTEXT = "dotfiles-test-coverage payload";

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

  assertCoverageRateMatchesLineCounts(
    lineCoverageRate,
    coveredLines,
    measurableLines,
    PAYLOAD_CONTEXT,
  );

  const files = requireNonEmptyArray(record, "files", PAYLOAD_CONTEXT).map(
    (entry, index) =>
      parseTestCoverageFileResult(entry, index, PAYLOAD_CONTEXT),
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
