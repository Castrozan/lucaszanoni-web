import type {
  AppAccessApplicationProvisioning,
  AppAccessModel,
  AppRegistryEntry,
} from "./app-registry-types";
import { AppRegistryValidationError } from "./app-registry-types";
import {
  asObjectRecord,
  rejectUnknownKeys,
  requireOneOf,
  requireString,
} from "./app-registry-field-parsers";

export function parseAccessModel(
  value: unknown,
  context: string,
): AppAccessModel {
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

export function parseAccessApplicationProvisioning(
  value: unknown,
  context: string,
): AppAccessApplicationProvisioning | undefined {
  if (value === undefined) {
    return undefined;
  }
  const record = asObjectRecord(
    value,
    `${context} accessApplicationProvisioning`,
  );
  const kind = requireOneOf(
    record,
    "kind",
    ["dedicated", "inherited-from-parent-path"] as const,
    `${context} accessApplicationProvisioning`,
  );
  if (kind === "inherited-from-parent-path") {
    rejectUnknownKeys(
      record,
      ["kind", "parentMountPath"],
      `${context} accessApplicationProvisioning`,
    );
    const parentMountPath = requireString(
      record,
      "parentMountPath",
      `${context} accessApplicationProvisioning`,
    );
    if (!parentMountPath.startsWith("/") || !parentMountPath.endsWith("/")) {
      throw new AppRegistryValidationError(
        `${context} accessApplicationProvisioning field parentMountPath must start and end with a slash`,
      );
    }
    return { kind, parentMountPath };
  }
  rejectUnknownKeys(
    record,
    ["kind"],
    `${context} accessApplicationProvisioning`,
  );
  return { kind };
}

export function assertInheritedAccessProvisioningIsSound(
  entries: readonly AppRegistryEntry[],
): void {
  const entryByMountPath = new Map(
    entries.map((entry) => [entry.mountPath, entry] as const),
  );
  for (const entry of entries) {
    const provisioning = entry.accessApplicationProvisioning;
    if (provisioning?.kind !== "inherited-from-parent-path") {
      continue;
    }
    const { parentMountPath } = provisioning;
    if (
      !entry.mountPath.startsWith(parentMountPath) ||
      entry.mountPath === parentMountPath
    ) {
      throw new AppRegistryValidationError(
        `app registry entry ${entry.id} inherits its access application from ${parentMountPath} which is not a strict path prefix of its mount path ${entry.mountPath}`,
      );
    }
    const parent = entryByMountPath.get(parentMountPath);
    if (!parent) {
      throw new AppRegistryValidationError(
        `app registry entry ${entry.id} inherits its access application from ${parentMountPath} but no app is mounted there`,
      );
    }
    if (parent.accessModel.kind === "public") {
      throw new AppRegistryValidationError(
        `app registry entry ${entry.id} inherits its access application from the public app ${parent.id} which would leave it ungated`,
      );
    }
    if (
      parent.accessApplicationProvisioning &&
      parent.accessApplicationProvisioning.kind !== "dedicated"
    ) {
      throw new AppRegistryValidationError(
        `app registry entry ${entry.id} inherits its access application from ${parent.id} which does not own a dedicated access application`,
      );
    }
  }
}
