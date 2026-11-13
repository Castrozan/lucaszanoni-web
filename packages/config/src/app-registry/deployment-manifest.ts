import type {
  AppCapability,
  AppOrigin,
  AppRegistryEntry,
  AppServingLocation,
  AppSource,
} from "./types.ts";

export interface ApplicationDeployment {
  readonly applicationId: string;
  readonly mountPath: string;
  readonly servingLocation: AppServingLocation;
  readonly source?: AppSource;
  readonly accessModel: AppRegistryEntry["accessModel"];
  readonly accessApplicationProvisioning?: AppRegistryEntry["accessApplicationProvisioning"];
  readonly capabilities?: readonly AppCapability[];
  readonly target: AppOrigin;
}

export interface DeploymentManifest {
  readonly applications: readonly ApplicationDeployment[];
}

export function createDeploymentManifest(
  registry: readonly AppRegistryEntry[],
): DeploymentManifest {
  return {
    applications: registry
      .filter((application) => application.status === "active")
      .map((application) => ({
        applicationId: application.id,
        mountPath: application.mountPath,
        servingLocation: application.servingLocation ?? {
          kind: "path-prefix" as const,
        },
        source: application.source,
        accessModel: application.accessModel,
        accessApplicationProvisioning:
          application.accessApplicationProvisioning,
        ...(application.capabilities === undefined
          ? {}
          : { capabilities: application.capabilities }),
        target: application.origin,
      }))
      .sort(
        (left, right) =>
          right.mountPath.length - left.mountPath.length ||
          left.applicationId.localeCompare(right.applicationId),
      ),
  };
}

export function createPublicBuildEnvironment(
  source: AppSource,
  environment: Readonly<Record<string, string | undefined>>,
): Readonly<Record<string, string>> {
  const resolved: Record<string, string> = {};
  for (const [name, reference] of Object.entries(
    source.publicBuildEnvironmentReferences,
  )) {
    const value = environment[reference];
    if (value !== undefined && value !== "") resolved[name] = value;
  }
  return { ...resolved, ...source.publicBuildEnvironment };
}
