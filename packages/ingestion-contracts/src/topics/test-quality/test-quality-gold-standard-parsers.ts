import { requireBoolean } from "../../field-parsers/boolean-field-parsers";
import { requireNonNegativeNumber } from "../../field-parsers/number-field-parsers";
import {
  asObjectRecord,
  rejectUnknownKeys,
  requireNonEmptyArray,
} from "../../field-parsers/record-shape-field-parsers";
import {
  requireString,
  requireUrlSafeLabel,
} from "../../field-parsers/text-field-parsers";
import { IngestionContractViolationError } from "../../ingestion-types";
import type { TestQualityGoldStandardPractice } from "./test-quality-types";

const GOLD_STANDARD_PRACTICES_FIELD = "goldStandardPractices";

function parseGoldStandardPractice(
  value: unknown,
  context: string,
): TestQualityGoldStandardPractice {
  const record = asObjectRecord(value, context);
  rejectUnknownKeys(
    record,
    ["practice", "adopted", "measurement", "measurementUnit", "evidence"],
    context,
  );

  const practice = requireUrlSafeLabel(record, "practice", context);
  const adopted = requireBoolean(record, "adopted", context);
  const measurement = requireNonNegativeNumber(record, "measurement", context);
  const measurementUnit = requireString(record, "measurementUnit", context);
  const evidence = requireString(record, "evidence", context);

  if (adopted && measurement <= 0) {
    throw new IngestionContractViolationError(
      `${context} reports ${practice} as adopted with nothing measured to show for it`,
    );
  }

  return { practice, adopted, measurement, measurementUnit, evidence };
}

function assertPracticesAreDistinct(
  practices: readonly TestQualityGoldStandardPractice[],
  context: string,
): void {
  const seen = new Set<string>();
  for (const { practice } of practices) {
    if (seen.has(practice)) {
      throw new IngestionContractViolationError(
        `${context} reports the practice ${practice} more than once`,
      );
    }
    seen.add(practice);
  }
}

export function parseGoldStandardPractices(
  payloadRecord: Record<string, unknown>,
  context: string,
): readonly TestQualityGoldStandardPractice[] {
  const declaredPractices = requireNonEmptyArray(
    payloadRecord,
    GOLD_STANDARD_PRACTICES_FIELD,
    context,
  );
  const practices = declaredPractices.map((declaredPractice) =>
    parseGoldStandardPractice(declaredPractice, context),
  );
  assertPracticesAreDistinct(practices, context);
  return practices;
}
