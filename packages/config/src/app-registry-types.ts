export type AppLifecycleStatus = "active" | "retired";

export type AppBuildProfile = "static-spa" | "dynamic-service";

export type AppExternalOriginPathRewrite = "preserve" | "strip-mount-path";

export type AppAccessModel =
  | { readonly kind: "public" }
  | { readonly kind: "owner-only" }
  | { readonly kind: "shared"; readonly audienceKey: string };

export type AppOrigin =
  | {
      readonly kind: "in-repo-cloud-run";
      readonly cloudRunServiceName: string;
      readonly appPackageName: string;
      readonly appDirectoryName: string;
      readonly buildProfile: AppBuildProfile;
      readonly nonSecretEnvironment: Readonly<Record<string, string>>;
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

export interface AppRegistryEntry {
  readonly id: string;
  readonly mountPath: string;
  readonly navigationLabel: string;
  readonly description: string;
  readonly showInCrossSectionNavigation: boolean;
  readonly status: AppLifecycleStatus;
  readonly accessModel: AppAccessModel;
  readonly origin: AppOrigin;
}

export class AppRegistryValidationError extends Error {}
