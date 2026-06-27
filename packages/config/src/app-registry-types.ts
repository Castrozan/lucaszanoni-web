export type AppLifecycleStatus = "active" | "retired";

export type AppBuildProfile = "static-spa" | "dynamic-service";

export type AppExternalOriginPathRewrite = "preserve" | "strip-mount-path";

export type AppServingLocation =
  | { readonly kind: "path-prefix" }
  | { readonly kind: "subdomain"; readonly subdomainLabel: string };

export const PUBLIC_ENVIRONMENT = "public";
export const PRIVATE_ENVIRONMENT = "private";

export type AppAccessEnvironment =
  | typeof PUBLIC_ENVIRONMENT
  | typeof PRIVATE_ENVIRONMENT;

export type AppAccessAudience =
  | { readonly kind: "owner" }
  | { readonly kind: "shared"; readonly audienceKey: string };

export type AppAccessModel =
  | { readonly environment: typeof PUBLIC_ENVIRONMENT }
  | {
      readonly environment: typeof PRIVATE_ENVIRONMENT;
      readonly audience: AppAccessAudience;
    };

export type AppAccessApplicationProvisioning =
  | { readonly kind: "dedicated" }
  | {
      readonly kind: "inherited-from-parent-path";
      readonly parentMountPath: string;
    };

export type AppOrigin =
  | {
      readonly kind: "in-repo-cloud-run";
      readonly cloudRunServiceName: string;
      readonly appPackageName: string;
      readonly appDirectoryName: string;
      readonly buildProfile: AppBuildProfile;
      readonly nonSecretEnvironment: Readonly<Record<string, string>>;
      readonly secretEnvironmentReferences: Readonly<Record<string, string>>;
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
  readonly accessApplicationProvisioning?: AppAccessApplicationProvisioning;
  readonly origin: AppOrigin;
  readonly servingLocation?: AppServingLocation;
  readonly healthProbePath?: string;
}

export class AppRegistryValidationError extends Error {}
