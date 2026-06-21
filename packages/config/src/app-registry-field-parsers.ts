import { AppRegistryValidationError } from "./app-registry-types";

export function asObjectRecord(
  value: unknown,
  context: string,
): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new AppRegistryValidationError(`${context} must be an object`);
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
    throw new AppRegistryValidationError(
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
    throw new AppRegistryValidationError(
      `${context} field ${key} must be a boolean`,
    );
  }
  return candidate;
}

export function requireOneOf<Allowed extends string>(
  record: Record<string, unknown>,
  key: string,
  allowed: readonly Allowed[],
  context: string,
): Allowed {
  const candidate = record[key];
  if (
    typeof candidate !== "string" ||
    !allowed.includes(candidate as Allowed)
  ) {
    throw new AppRegistryValidationError(
      `${context} field ${key} must be one of ${allowed.join(", ")}`,
    );
  }
  return candidate as Allowed;
}

export function requireStringAllowEmpty(
  record: Record<string, unknown>,
  key: string,
  context: string,
): string {
  const candidate = record[key];
  if (typeof candidate !== "string") {
    throw new AppRegistryValidationError(
      `${context} field ${key} must be a string`,
    );
  }
  return candidate;
}

export function requireMountPath(
  record: Record<string, unknown>,
  context: string,
): string {
  const mountPath = requireString(record, "mountPath", context);
  if (!mountPath.startsWith("/") || !mountPath.endsWith("/")) {
    throw new AppRegistryValidationError(
      `${context} field mountPath must start and end with a slash`,
    );
  }
  return mountPath;
}

export function requireBareHostname(
  record: Record<string, unknown>,
  key: string,
  context: string,
): string {
  const hostname = requireString(record, key, context);
  if (hostname.includes(":") || hostname.includes("/")) {
    throw new AppRegistryValidationError(
      `${context} field ${key} must be a bare hostname without a scheme, port, or path`,
    );
  }
  return hostname;
}

export function requireForwardedBasePath(
  record: Record<string, unknown>,
  key: string,
  context: string,
): string {
  const forwardedBasePath = requireStringAllowEmpty(record, key, context);
  if (
    forwardedBasePath.length > 0 &&
    (!forwardedBasePath.startsWith("/") || !forwardedBasePath.endsWith("/"))
  ) {
    throw new AppRegistryValidationError(
      `${context} field ${key} must be empty or start and end with a slash`,
    );
  }
  return forwardedBasePath;
}

export function rejectUnknownKeys(
  record: Record<string, unknown>,
  allowedKeys: readonly string[],
  context: string,
): void {
  const allowed = new Set<string>(allowedKeys);
  for (const key of Object.keys(record)) {
    if (!allowed.has(key)) {
      throw new AppRegistryValidationError(
        `${context} has an unexpected property ${key}`,
      );
    }
  }
}
