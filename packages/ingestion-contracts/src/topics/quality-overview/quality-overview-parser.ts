import Ajv, { type ValidateFunction } from "ajv";
import addFormats from "ajv-formats";
import { IngestionContractViolationError } from "../../ingestion-types";
import { checkQualityOverviewConsistency } from "./quality-overview-consistency";
import { qualityOverviewPayloadSchema } from "./quality-overview-schema";
import type { QualityOverviewPayload } from "./quality-overview-types";

let validatePayload: ValidateFunction<QualityOverviewPayload> | undefined;

function payloadValidator(): ValidateFunction<QualityOverviewPayload> {
  if (validatePayload !== undefined) return validatePayload;
  const validator = new Ajv({ allErrors: true });
  addFormats(validator);
  validatePayload = validator.compile<QualityOverviewPayload>(
    qualityOverviewPayloadSchema,
  );
  return validatePayload;
}

export function parseQualityOverviewPayload(
  value: unknown,
): QualityOverviewPayload {
  const validate = payloadValidator();
  if (!validate(value)) {
    throw new IngestionContractViolationError(
      `quality overview payload is malformed: ${JSON.stringify(validate.errors)}`,
    );
  }
  checkQualityOverviewConsistency(value);
  return value;
}
