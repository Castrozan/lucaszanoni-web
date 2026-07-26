import { IngestionContractViolationError } from "../ingestion-types";

export function requireBoolean(
  record: Record<string, unknown>,
  key: string,
  context: string,
): boolean {
  const candidate = record[key];
  if (typeof candidate !== "boolean") {
    throw new IngestionContractViolationError(
      `${context} field ${key} must be a boolean`,
    );
  }
  return candidate;
}
