import { appRegistry } from "./app-registry";
import type { MicroFrontendId } from "./app-registry";
import type { AppRegistryEntry } from "./app-registry-types";

export type { MicroFrontendId };

export interface MicroFrontendRoute {
  readonly id: MicroFrontendId;
  readonly navigationLabel: string;
  readonly description: string;
  readonly mountPath: string;
  readonly accessModel: AppRegistryEntry["accessModel"];
  readonly origin: AppRegistryEntry["origin"];
}

export const MICRO_FRONTEND_ROUTES: readonly MicroFrontendRoute[] =
  appRegistry.map((entry) => ({
    id: entry.id,
    navigationLabel: entry.navigationLabel,
    description: entry.description,
    mountPath: entry.mountPath,
    accessModel: entry.accessModel,
    origin: entry.origin,
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
  findMicroFrontendRoute("reports");

export function isPubliclyVisibleNavigationEntry(
  entry: AppRegistryEntry,
): boolean {
  return (
    entry.showInCrossSectionNavigation && entry.accessModel.kind === "public"
  );
}

const publiclyVisibleNavigationIds = new Set(
  appRegistry.filter(isPubliclyVisibleNavigationEntry).map((entry) => entry.id),
);

export const CROSS_SECTION_NAVIGATION_ROUTES: readonly MicroFrontendRoute[] =
  MICRO_FRONTEND_ROUTES.filter((route) =>
    publiclyVisibleNavigationIds.has(route.id),
  );
