import type { AppRegistryEntry, AppServingLocation } from "./types.ts";
import { AppRegistryValidationError } from "./types.ts";
import {
  asObjectRecord,
  optionalAbsolutePath,
  rejectUnknownKeys,
  requireBoolean,
  requireMountPath,
  requireOneOf,
  requireString,
  requireSubdomainLabel,
} from "./field-parsers.ts";
import {
  assertInheritedAccessProvisioningIsSound,
  parseAccessApplicationProvisioning,
  parseAccessModel,
} from "./access-parsers.ts";
import { belongsToPrivateEnvironment } from "./access-environment.ts";
import { parseOrigin } from "./origin-parser.ts";
import { parseCapabilities, parseSource } from "./source-parser.ts";

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
      "accessApplicationProvisioning",
      "origin",
      "source",
      "capabilities",
      "servingLocation",
      "healthProbePath",
    ],
    context,
  );
  const accessModel = parseAccessModel(record["accessModel"], context);
  const origin = parseOrigin(record["origin"], context);
  const source = parseSource(record["source"], context);
  if (origin.kind === "cloudflare-worker" && !source) {
    throw new AppRegistryValidationError(
      `${context} origin ${origin.kind} requires repository source`,
    );
  }
  if (
    origin.kind === "static-gcs-bucket" &&
    belongsToPrivateEnvironment(accessModel)
  ) {
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
    accessApplicationProvisioning: parseAccessApplicationProvisioning(
      record["accessApplicationProvisioning"],
      context,
    ),
    origin,
    source,
    capabilities: parseCapabilities(record["capabilities"], context),
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
  assertUnique(
    entries.flatMap((entry) =>
      entry.source ? [entry.source.appDirectoryName] : [],
    ),
    "appDirectoryName",
  );
  assertUnique(
    entries.flatMap((entry) =>
      entry.origin.kind === "cloudflare-worker"
        ? [entry.origin.scriptName]
        : [],
    ),
    "scriptName",
  );
  assertUnique(collectSubdomainLabels(entries), "subdomainLabel");
  assertInheritedAccessProvisioningIsSound(entries);
  return entries;
}
