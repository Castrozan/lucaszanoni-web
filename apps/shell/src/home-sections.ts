import {
  NAVIGATION_TEASE_ROUTES,
  belongsToPrivateEnvironment,
} from "@platform/config";
import type {
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

export function buildHomeSectionCards(): HomeSectionCard[] {
  return NAVIGATION_TEASE_ROUTES.map((route) => {
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
  });
}
