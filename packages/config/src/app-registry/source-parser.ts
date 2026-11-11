import type { AppCapability, AppSource } from "./types.ts";
import { AppRegistryValidationError } from "./types.ts";
import {
  asObjectRecord,
  rejectUnknownKeys,
  requireOneOf,
  requireString,
  requireStringMap,
} from "./field-parsers.ts";

export function parseSource(
  value: unknown,
  context: string,
): AppSource | undefined {
  if (value === undefined) return undefined;
  const record = asObjectRecord(value, `${context} source`);
  rejectUnknownKeys(
    record,
    [
      "appPackageName",
      "appDirectoryName",
      "buildProfile",
      "publicBuildEnvironment",
      "publicBuildEnvironmentReferences",
    ],
    `${context} source`,
  );
  const appDirectoryName = requireString(
    record,
    "appDirectoryName",
    `${context} source`,
  );
  if (!/^[a-z0-9][a-z0-9-]*$/.test(appDirectoryName)) {
    throw new AppRegistryValidationError(
      `${context} source appDirectoryName must be a single repository directory name`,
    );
  }
  const publicBuildEnvironment = requireStringMap(
    record,
    "publicBuildEnvironment",
    `${context} source`,
  );
  const publicBuildEnvironmentReferences = requireStringMap(
    record,
    "publicBuildEnvironmentReferences",
    `${context} source`,
  );
  for (const name of [
    ...Object.keys(publicBuildEnvironment),
    ...Object.keys(publicBuildEnvironmentReferences),
  ]) {
    if (!/^(VITE_|NEXT_PUBLIC_)[A-Z0-9_]+$/.test(name)) {
      throw new AppRegistryValidationError(
        `${context} source build environment ${name} must be explicitly public`,
      );
    }
  }
  return {
    appPackageName: requireString(
      record,
      "appPackageName",
      `${context} source`,
    ),
    appDirectoryName,
    buildProfile: requireOneOf(
      record,
      "buildProfile",
      ["static-spa", "dynamic-service"] as const,
      `${context} source`,
    ),
    publicBuildEnvironment,
    publicBuildEnvironmentReferences,
  };
}

export function parseCapabilities(
  value: unknown,
  context: string,
): readonly AppCapability[] | undefined {
  if (value === undefined) return undefined;
  if (
    !Array.isArray(value) ||
    value.some((capability) => capability !== "generative-ai") ||
    new Set(value).size !== value.length
  ) {
    throw new AppRegistryValidationError(
      `${context} capabilities must contain unique supported capabilities`,
    );
  }
  return value;
}
