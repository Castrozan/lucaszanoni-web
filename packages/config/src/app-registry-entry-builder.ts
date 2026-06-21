import type {
  AppAccessModel,
  AppBuildProfile,
  AppExternalOriginPathRewrite,
  AppLifecycleStatus,
  AppOrigin,
  AppRegistryEntry,
} from "./app-registry-types";

export type AppOriginSpec =
  | {
      readonly kind: "in-repo-cloud-run";
      readonly buildProfile: AppBuildProfile;
    }
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
  readonly origin: AppOriginSpec;
}

const inRepoCloudRunServiceNamePrefix = "lucaszanoni-";
const inRepoCloudRunPackageScope = "@lucaszanoni-web";

function buildOrigin(id: string, origin: AppOriginSpec): AppOrigin {
  switch (origin.kind) {
    case "in-repo-cloud-run":
      return {
        kind: "in-repo-cloud-run",
        cloudRunServiceName: `${inRepoCloudRunServiceNamePrefix}${id}`,
        appPackageName: `${inRepoCloudRunPackageScope}/${id}`,
        appDirectoryName: id,
        buildProfile: origin.buildProfile,
        nonSecretEnvironment: {},
        secretEnvironmentReferences: {},
      };
    case "external-https":
      return {
        kind: "external-https",
        originHost: origin.originHost,
        pathRewrite: origin.pathRewrite,
        forwardedBasePath: origin.forwardedBasePath,
        trusted: origin.trusted,
      };
    case "static-gcs-bucket":
      return {
        kind: "static-gcs-bucket",
        bucketName: origin.bucketName,
        objectKeyPrefix: origin.objectKeyPrefix,
      };
  }
}

export function buildAppRegistryEntry(
  input: AppRegistryEntryBuilderInput,
): AppRegistryEntry {
  return {
    id: input.id,
    mountPath: input.mountPath,
    navigationLabel: input.navigationLabel,
    description: input.description,
    showInCrossSectionNavigation: input.showInCrossSectionNavigation,
    status: input.status,
    accessModel: input.accessModel,
    origin: buildOrigin(input.id, input.origin),
  };
}
