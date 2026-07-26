import { IngestionContractViolationError } from "./ingestion-types";

export const URL_SAFE_LABEL_PATTERN = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

export const TIMESTAMP_WITH_TIMEZONE_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

export function asObjectRecord(
  value: unknown,
  context: string,
): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new IngestionContractViolationError(`${context} must be an object`);
  }
  return value as Record<string, unknown>;
}

export function requireString(
  record: Record<string, unknown>,
  key: string,
  context: string,
): string {
  const candidate = record[key];
  if (typeof candidate !== "string" || candidate.length === 0) {
    throw new IngestionContractViolationError(
      `${context} field ${key} must be a non-empty string`,
    );
  }
  return candidate;
}

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

export function requireUrlSafeLabel(
  record: Record<string, unknown>,
  key: string,
  context: string,
): string {
  const label = requireString(record, key, context);
  if (!URL_SAFE_LABEL_PATTERN.test(label)) {
    throw new IngestionContractViolationError(
      `${context} field ${key} must be lowercase letters, digits, and hyphens that do not start or end the label`,
    );
  }
  return label;
}

export function requireTimestamp(
  record: Record<string, unknown>,
  key: string,
  context: string,
): string {
  const timestamp = requireString(record, key, context);
  if (
    !TIMESTAMP_WITH_TIMEZONE_PATTERN.test(timestamp) ||
    Number.isNaN(Date.parse(timestamp))
  ) {
    throw new IngestionContractViolationError(
      `${context} field ${key} must be an iso 8601 timestamp carrying an explicit timezone designator`,
    );
  }
  return timestamp;
}

export function requireNonEmptyArray(
  record: Record<string, unknown>,
  key: string,
  context: string,
): readonly unknown[] {
  const candidate = record[key];
  if (!Array.isArray(candidate) || candidate.length === 0) {
    throw new IngestionContractViolationError(
      `${context} field ${key} must be a non-empty array`,
    );
  }
  return candidate;
}

export function optionalHttpsUrl(
  record: Record<string, unknown>,
  key: string,
  context: string,
): string | undefined {
  const candidate = record[key];
  if (candidate === undefined) {
    return undefined;
  }
  if (typeof candidate !== "string" || !candidate.startsWith("https://")) {
    throw new IngestionContractViolationError(
      `${context} field ${key} must be an https url when present`,
    );
  }
  return candidate;
}

export function optionalString(
  record: Record<string, unknown>,
  key: string,
  context: string,
): string | undefined {
  if (record[key] === undefined) {
    return undefined;
  }
  return requireString(record, key, context);
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
