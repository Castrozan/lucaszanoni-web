import { IngestionContractViolationError } from "../ingestion-types";

export const URL_SAFE_LABEL_PATTERN = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

export const TIMESTAMP_WITH_TIMEZONE_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

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
