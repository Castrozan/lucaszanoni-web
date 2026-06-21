import { findMicroFrontendRoute } from "@platform/config";
import type { MicroFrontendId } from "@platform/config";

export interface BreadcrumbStep {
  readonly label: string;
  readonly href: string;
}

export function buildBreadcrumbTrail(
  activeRouteId: MicroFrontendId,
): BreadcrumbStep[] {
  const shellRoute = findMicroFrontendRoute("shell");
  const trail: BreadcrumbStep[] = [
    { label: shellRoute.navigationLabel, href: shellRoute.mountPath },
  ];
  if (activeRouteId !== "shell") {
    const activeRoute = findMicroFrontendRoute(activeRouteId);
    trail.push({
      label: activeRoute.navigationLabel,
      href: activeRoute.mountPath,
    });
  }
  return trail;
}
