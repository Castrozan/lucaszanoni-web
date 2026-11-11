import type {
  AppAccessModel,
  AppBuildProfile,
  AppCapability,
  AppExternalOriginPathRewrite,
  AppLifecycleStatus,
  AppOrigin,
  AppRegistryEntry,
} from "./types.ts";
import { AppRegistryValidationError } from "./types.ts";

export interface AppSourceSpec {
  readonly buildProfile: AppBuildProfile;
  readonly publicBuildEnvironment?: Readonly<Record<string, string>>;
  readonly publicBuildEnvironmentReferences?: Readonly<Record<string, string>>;
}

export type AppOriginSpec =
  | { readonly kind: "cloudflare-worker" }
  | { readonly kind: "cloud-run" }
  | {
      readonly kind: "external-https";
      readonly originHost: string;
      readonly pathRewrite: AppExternalOriginPathRewrite;
      readonly forwardedBasePath: string;
      readonly trusted: boolean;
    }
  | {
      readonly kind: "static-gcs-bucket";
      readonly bucketName: string;
      readonly objectKeyPrefix: string;
    };

export interface AppRegistryEntryBuilderInput {
  readonly id: string;
  readonly mountPath: string;
  readonly navigationLabel: string;
  readonly description: string;
  readonly showInCrossSectionNavigation: boolean;
  readonly status: AppLifecycleStatus;
  readonly accessModel: AppAccessModel;
  readonly source?: AppSourceSpec;
  readonly capabilities?: readonly AppCapability[];
  readonly origin: AppOriginSpec;
}

function buildOrigin(id: string, origin: AppOriginSpec): AppOrigin {
  switch (origin.kind) {
    case "cloudflare-worker":
      return { kind: origin.kind, scriptName: `lucaszanoni-${id}` };
    case "cloud-run":
      return {
        kind: origin.kind,
        cloudRunServiceName: `lucaszanoni-${id}`,
        nonSecretEnvironment: {},
        secretEnvironmentReferences: {},
      };
    case "external-https":
    case "static-gcs-bucket":
      return { ...origin };
  }
}

export function buildAppRegistryEntry(
  input: AppRegistryEntryBuilderInput,
): AppRegistryEntry {
  const origin = buildOrigin(input.id, input.origin);
  if (
    (origin.kind === "cloud-run" || origin.kind === "cloudflare-worker") &&
    !input.source
  ) {
    throw new AppRegistryValidationError(
      `app ${input.id} origin ${origin.kind} requires repository source`,
    );
  }
  return {
    id: input.id,
    mountPath: input.mountPath,
    navigationLabel: input.navigationLabel,
    description: input.description,
    showInCrossSectionNavigation: input.showInCrossSectionNavigation,
    status: input.status,
    accessModel: input.accessModel,
    capabilities: input.capabilities,
    source: input.source
      ? {
          appPackageName: `@platform/${input.id}`,
          appDirectoryName: input.id,
          buildProfile: input.source.buildProfile,
          publicBuildEnvironment: input.source.publicBuildEnvironment ?? {},
          publicBuildEnvironmentReferences:
            input.source.publicBuildEnvironmentReferences ?? {},
        }
      : undefined,
    origin,
  };
}
