import {
  MICRO_FRONTEND_ROUTES,
  NAVIGATION_TEASE_ROUTES,
  belongsToPrivateEnvironment,
} from "@platform/config";
import type {
  MicroFrontendRoute,
  AppAccessAudience,
  AppAccessEnvironment,
  AppBuildProfile,
  AppLifecycleStatus,
  AppOrigin,
} from "@platform/config";

export interface HomeSectionCard {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly href: string;
  readonly locked: boolean;
  readonly accessEnvironment: AppAccessEnvironment;
  readonly audienceKind?: AppAccessAudience["kind"];
  readonly originKind: AppOrigin["kind"];
  readonly buildProfile?: AppBuildProfile;
  readonly isAiPowered: boolean;
  readonly status: AppLifecycleStatus;
}

function mapRouteToCard(route: MicroFrontendRoute): HomeSectionCard {
  const locked = belongsToPrivateEnvironment(route.accessModel);
  const audienceKind =
    route.accessModel.environment === "private"
      ? route.accessModel.audience.kind
      : undefined;
  const buildProfile =
    route.origin.kind === "in-repo-cloud-run"
      ? route.origin.buildProfile
      : undefined;
  return {
    id: route.id,
    title: route.navigationLabel,
    description: route.description,
    href: route.mountPath,
    locked,
    accessEnvironment: route.accessModel.environment,
    audienceKind,
    originKind: route.origin.kind,
    buildProfile,
    isAiPowered: route.isAiPowered,
    status: route.status,
  };
}

export function buildHomeSectionCards(): HomeSectionCard[] {
  return NAVIGATION_TEASE_ROUTES.map(mapRouteToCard);
}

export function buildCatalogCards(): HomeSectionCard[] {
  return MICRO_FRONTEND_ROUTES.filter((route) => route.id !== "shell").map(
    mapRouteToCard,
  );
}
