import validatePayload from "./generated/quality-overview-validator.cjs";
import { IngestionContractViolationError } from "../../ingestion-types";
import { checkQualityOverviewConsistency } from "./quality-overview-consistency";

import type { QualityOverviewPayload } from "./quality-overview-types";

export function parseQualityOverviewPayload(
  value: unknown,
): QualityOverviewPayload {
  if (!validatePayload(value)) {
    throw new IngestionContractViolationError(
      `quality overview payload is malformed: ${JSON.stringify(validatePayload.errors)}`,
    );
  }
  checkQualityOverviewConsistency(value);
  return value;
}
