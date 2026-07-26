import { IngestionContractViolationError } from "../ingestion-types";

export function requireNonNegativeInteger(
  record: Record<string, unknown>,
  key: string,
  context: string,
): number {
  const candidate = record[key];
  if (
    typeof candidate !== "number" ||
    !Number.isInteger(candidate) ||
    candidate < 0
  ) {
    throw new IngestionContractViolationError(
      `${context} field ${key} must be a non-negative integer`,
    );
  }
  return candidate;
}

export function requirePositiveInteger(
  record: Record<string, unknown>,
  key: string,
  context: string,
): number {
  const candidate = requireNonNegativeInteger(record, key, context);
  if (candidate === 0) {
    throw new IngestionContractViolationError(
      `${context} field ${key} must be greater than zero`,
    );
  }
  return candidate;
}

export function requireNonNegativeNumber(
  record: Record<string, unknown>,
  key: string,
  context: string,
): number {
  const candidate = record[key];
  if (
    typeof candidate !== "number" ||
    !Number.isFinite(candidate) ||
    candidate < 0
  ) {
    throw new IngestionContractViolationError(
      `${context} field ${key} must be a finite number that is not negative`,
    );
  }
  return candidate;
}

export function requireFiniteNumber(
  record: Record<string, unknown>,
  key: string,
  context: string,
): number {
  const candidate = record[key];
  if (typeof candidate !== "number" || !Number.isFinite(candidate)) {
    throw new IngestionContractViolationError(
      `${context} field ${key} must be a finite number`,
    );
  }
  return candidate;
}

export function requireUnitInterval(
  record: Record<string, unknown>,
  key: string,
  context: string,
): number {
  const candidate = record[key];
  if (
    typeof candidate !== "number" ||
    !Number.isFinite(candidate) ||
    candidate < 0 ||
    candidate > 1
  ) {
    throw new IngestionContractViolationError(
      `${context} field ${key} must be a number between zero and one`,
    );
  }
  return candidate;
}
