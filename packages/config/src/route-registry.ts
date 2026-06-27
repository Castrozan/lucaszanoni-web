import { appRegistry } from "./app-registry";
import type { MicroFrontendId } from "./app-registry";
import type {
  AppRegistryEntry,
  AppLifecycleStatus,
} from "./app-registry-types";
import { belongsToPrivateEnvironment } from "./app-registry-access-environment";

export type { MicroFrontendId };

const GEMINI_API_KEY_ENVIRONMENT_VARIABLE_NAME = "GOOGLE_GENERATIVE_AI_API_KEY";

function originDeclaresAiModelKey(origin: AppRegistryEntry["origin"]): boolean {
  return (
    origin.kind === "in-repo-cloud-run" &&
    GEMINI_API_KEY_ENVIRONMENT_VARIABLE_NAME in
      origin.secretEnvironmentReferences
  );
}

export interface MicroFrontendRoute {
  readonly id: MicroFrontendId;
  readonly navigationLabel: string;
  readonly description: string;
  readonly mountPath: string;
  readonly status: AppLifecycleStatus;
  readonly showInCrossSectionNavigation: boolean;
  readonly isAiPowered: boolean;
  readonly accessModel: AppRegistryEntry["accessModel"];
  readonly origin: AppRegistryEntry["origin"];
}

export const MICRO_FRONTEND_ROUTES: readonly MicroFrontendRoute[] =
  appRegistry.map((entry) => ({
    id: entry.id,
    navigationLabel: entry.navigationLabel,
    description: entry.description,
    mountPath: entry.mountPath,
    status: entry.status,
    showInCrossSectionNavigation: entry.showInCrossSectionNavigation,
    isAiPowered: originDeclaresAiModelKey(entry.origin),
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

export const NAVIGATION_TEASE_ROUTES: readonly MicroFrontendRoute[] =
  MICRO_FRONTEND_ROUTES.filter((route) => route.showInCrossSectionNavigation);
