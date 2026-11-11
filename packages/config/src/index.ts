export {
  SITE_DOMAIN,
  SHELL_MOUNT_PATH,
  USAGE_DASHBOARD_MOUNT_PATH,
  REPORTS_MOUNT_PATH,
  COCKPIT_MOUNT_PATH,
  WORKSPACE_MOUNT_PATH,
} from "./mount-paths.ts";
export type { MicroFrontendId, MicroFrontendRoute } from "./route-registry.ts";
export {
  MICRO_FRONTEND_ROUTES,
  CROSS_SECTION_NAVIGATION_ROUTES,
  OWNER_SIGN_IN_ENTRY_ROUTE,
  findMicroFrontendRoute,
} from "./route-registry.ts";
export type {
  PlatformWindow,
  PlatformSession,
  ActivePlatformLocation,
} from "./platform-sessions.ts";
export {
  buildPlatformSessions,
  findActiveLocation,
  nextWindowIndex,
  previousWindowIndex,
} from "./platform-sessions.ts";
export type {
  AppLifecycleStatus,
  AppBuildProfile,
  AppExternalOriginPathRewrite,
  AppServingLocation,
  AppAccessEnvironment,
  AppAccessAudience,
  AppAccessModel,
  AppOrigin,
  AppRegistryEntry,
} from "./app-registry/types.ts";
export {
  PUBLIC_ENVIRONMENT,
  PRIVATE_ENVIRONMENT,
} from "./app-registry/types.ts";
export { belongsToPrivateEnvironment } from "./app-registry/access-environment.ts";
export { parseAppRegistry } from "./app-registry/parser.ts";
export {
  defaultServingLocation,
  resolveServingLocation,
} from "./app-registry/serving-location.ts";
export { appRegistry } from "./app-registry.ts";
export type {
  AppOriginSpec,
  AppRegistryEntryBuilderInput,
} from "./app-registry/entry-builder.ts";
export { buildAppRegistryEntry } from "./app-registry/entry-builder.ts";
export type {
  AddAppAnswers,
  AddAppAccessModelChoice,
} from "./app-registry/answers-resolver.ts";
export {
  resolveAccessModel,
  resolveOriginSpec,
} from "./app-registry/answers-resolver.ts";
export { appendEntryToRegistryDocument } from "./app-registry/document-writer.ts";

export {
  createDeploymentManifest,
  createPublicBuildEnvironment,
} from "./app-registry/deployment-manifest.ts";
export type {
  ApplicationDeployment,
  DeploymentManifest,
} from "./app-registry/deployment-manifest.ts";
export type { AppSource, AppCapability } from "./app-registry/types.ts";
export type { AppSourceSpec } from "./app-registry/entry-builder.ts";

export {
  createSnapshotArtifactLocations,
  SNAPSHOT_ARTIFACT_LOCATIONS,
} from "./snapshot-artifacts.ts";
export type { SnapshotArtifactLocations } from "./snapshot-artifacts.ts";
