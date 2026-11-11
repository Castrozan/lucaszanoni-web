import { appRegistry } from "./app-registry.ts";
import type { MicroFrontendId } from "./app-registry.ts";
import type {
  AppRegistryEntry,
  AppLifecycleStatus,
  AppOrigin,
  AppBuildProfile,
} from "./app-registry/types.ts";
import { belongsToPrivateEnvironment } from "./app-registry/access-environment.ts";

export type { MicroFrontendId };

export interface MicroFrontendRoute {
  readonly id: MicroFrontendId;
  readonly navigationLabel: string;
  readonly description: string;
  readonly mountPath: string;
  readonly status: AppLifecycleStatus;
  readonly showInCrossSectionNavigation: boolean;
  readonly isAiPowered: boolean;
  readonly accessModel: AppRegistryEntry["accessModel"];
  readonly hostingKind: AppOrigin["kind"];
  readonly buildProfile?: AppBuildProfile;
}

export const MICRO_FRONTEND_ROUTES: readonly MicroFrontendRoute[] =
  appRegistry.map((entry) => ({
    id: entry.id,
    navigationLabel: entry.navigationLabel,
    description: entry.description,
    mountPath: entry.mountPath,
    status: entry.status,
    showInCrossSectionNavigation: entry.showInCrossSectionNavigation,
    isAiPowered: entry.capabilities?.includes("generative-ai") ?? false,
    accessModel: entry.accessModel,
    hostingKind: entry.origin.kind,
    buildProfile: entry.source?.buildProfile,
  }));

export function findMicroFrontendRoute(
  id: MicroFrontendId,
): MicroFrontendRoute {
  const route = MICRO_FRONTEND_ROUTES.find((candidate) => candidate.id === id);
  if (!route) {
    throw new Error(`no micro frontend route registered for id ${id}`);
  }
  return route;
}

export const OWNER_SIGN_IN_ENTRY_ROUTE: MicroFrontendRoute =
  findMicroFrontendRoute("cockpit");

export function isPubliclyVisibleNavigationEntry(
  entry: AppRegistryEntry,
): boolean {
  return (
    entry.showInCrossSectionNavigation &&
    !belongsToPrivateEnvironment(entry.accessModel)
  );
}

const publiclyVisibleNavigationIds = new Set(
  appRegistry.filter(isPubliclyVisibleNavigationEntry).map((entry) => entry.id),
);

export const CROSS_SECTION_NAVIGATION_ROUTES: readonly MicroFrontendRoute[] =
  MICRO_FRONTEND_ROUTES.filter((route) =>
    publiclyVisibleNavigationIds.has(route.id),
  );
