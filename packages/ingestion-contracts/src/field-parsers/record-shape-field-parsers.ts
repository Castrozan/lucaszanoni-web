import { IngestionContractViolationError } from "../ingestion-types";

export function asObjectRecord(
  value: unknown,
  context: string,
): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new IngestionContractViolationError(`${context} must be an object`);
  }
  return value as Record<string, unknown>;
}

export function requireArray(
  record: Record<string, unknown>,
  key: string,
  context: string,
): readonly unknown[] {
  const candidate = record[key];
  if (!Array.isArray(candidate)) {
    throw new IngestionContractViolationError(
      `${context} field ${key} must be an array`,
    );
  }
  return candidate;
}

export function requireNonEmptyArray(
  record: Record<string, unknown>,
  key: string,
  context: string,
): readonly unknown[] {
  const candidate = requireArray(record, key, context);
  if (candidate.length === 0) {
    throw new IngestionContractViolationError(
      `${context} field ${key} must be a non-empty array`,
    );
  }
  return candidate;
}

export function rejectUnknownKeys(
  record: Record<string, unknown>,
  allowedKeys: readonly string[],
  context: string,
): void {
  const allowed = new Set<string>(allowedKeys);
  for (const key of Object.keys(record)) {
    if (!allowed.has(key)) {
      throw new IngestionContractViolationError(
        `${context} has an unexpected property ${key}`,
      );
    }
  }
}
