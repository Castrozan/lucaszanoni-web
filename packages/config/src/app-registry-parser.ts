import type {
  AppAccessModel,
  AppOrigin,
  AppRegistryEntry,
  AppServingLocation,
} from "./app-registry-types";
import { AppRegistryValidationError } from "./app-registry-types";
import {
  asObjectRecord,
  optionalAbsolutePath,
  rejectUnknownKeys,
  requireBoolean,
  requireMountPath,
  requireOneOf,
  requireString,
  requireSubdomainLabel,
} from "./app-registry-field-parsers";
import { parseOrigin } from "./app-registry-origin-parser";

function parseAccessModel(value: unknown, context: string): AppAccessModel {
  const record = asObjectRecord(value, `${context} accessModel`);
  const kind = requireOneOf(
    record,
    "kind",
    ["public", "owner-only", "shared"] as const,
    `${context} accessModel`,
  );
  if (kind === "shared") {
    rejectUnknownKeys(
      record,
      ["kind", "audienceKey"],
      `${context} accessModel`,
    );
    return {
      kind,
      audienceKey: requireString(
        record,
        "audienceKey",
        `${context} accessModel`,
      ),
    };
  }
  rejectUnknownKeys(record, ["kind"], `${context} accessModel`);
  return { kind };
}

function parseServingLocation(
  value: unknown,
  context: string,
): AppServingLocation | undefined {
  if (value === undefined) {
    return undefined;
  }
  const record = asObjectRecord(value, `${context} servingLocation`);
  const kind = requireOneOf(
    record,
    "kind",
    ["path-prefix", "subdomain"] as const,
    `${context} servingLocation`,
  );
  if (kind === "subdomain") {
    rejectUnknownKeys(
      record,
      ["kind", "subdomainLabel"],
      `${context} servingLocation`,
    );
    return {
      kind,
      subdomainLabel: requireSubdomainLabel(
        record,
        "subdomainLabel",
        `${context} servingLocation`,
      ),
    };
  }
  rejectUnknownKeys(record, ["kind"], `${context} servingLocation`);
  return { kind };
}

function parseAppRegistryEntry(
  value: unknown,
  index: number,
): AppRegistryEntry {
  const context = `app registry entry ${index}`;
  const record = asObjectRecord(value, context);
  rejectUnknownKeys(
    record,
    [
      "id",
      "mountPath",
      "navigationLabel",
      "description",
      "showInCrossSectionNavigation",
      "status",
      "accessModel",
      "origin",
      "servingLocation",
      "healthProbePath",
    ],
    context,
  );
  const accessModel = parseAccessModel(record["accessModel"], context);
  const origin = parseOrigin(record["origin"], context);
  if (origin.kind === "static-gcs-bucket" && accessModel.kind !== "public") {
    throw new AppRegistryValidationError(
      `${context} with a static-gcs-bucket origin must use a public access model because the bucket object url bypasses edge auth`,
    );
  }
  return {
    id: requireString(record, "id", context),
    mountPath: requireMountPath(record, context),
    navigationLabel: requireString(record, "navigationLabel", context),
    description: requireString(record, "description", context),
    showInCrossSectionNavigation: requireBoolean(
      record,
      "showInCrossSectionNavigation",
      context,
    ),
    status: requireOneOf(
      record,
      "status",
      ["active", "retired"] as const,
      context,
    ),
    accessModel,
    origin,
    servingLocation: parseServingLocation(record["servingLocation"], context),
    healthProbePath: optionalAbsolutePath(record, "healthProbePath", context),
  };
}

function assertUnique(values: readonly string[], label: string): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) {
      throw new AppRegistryValidationError(
        `app registry has a duplicate ${label} ${value}`,
      );
    }
    seen.add(value);
  }
}

function collectInRepoCloudRunOrigins(
  entries: readonly AppRegistryEntry[],
): readonly Extract<AppOrigin, { kind: "in-repo-cloud-run" }>[] {
  const origins: Extract<AppOrigin, { kind: "in-repo-cloud-run" }>[] = [];
  for (const entry of entries) {
    if (entry.origin.kind === "in-repo-cloud-run") {
      origins.push(entry.origin);
    }
  }
  return origins;
}

function collectSubdomainLabels(
  entries: readonly AppRegistryEntry[],
): readonly string[] {
  const subdomainLabels: string[] = [];
  for (const entry of entries) {
    if (entry.servingLocation?.kind === "subdomain") {
      subdomainLabels.push(entry.servingLocation.subdomainLabel);
    }
  }
  return subdomainLabels;
}

export function parseAppRegistry(value: unknown): readonly AppRegistryEntry[] {
  if (!Array.isArray(value)) {
    throw new AppRegistryValidationError("app registry must be a json array");
  }
  const entries = value.map(parseAppRegistryEntry);
  assertUnique(
    entries.map((entry) => entry.id),
    "id",
  );
  assertUnique(
    entries.map((entry) => entry.mountPath),
    "mountPath",
  );
  const inRepoCloudRunOrigins = collectInRepoCloudRunOrigins(entries);
  assertUnique(
    inRepoCloudRunOrigins.map((origin) => origin.cloudRunServiceName),
    "cloudRunServiceName",
  );
  assertUnique(
    inRepoCloudRunOrigins.map((origin) => origin.appDirectoryName),
    "appDirectoryName",
  );
  assertUnique(collectSubdomainLabels(entries), "subdomainLabel");
  return entries;
}
