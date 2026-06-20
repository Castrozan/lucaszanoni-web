import {
  REPORTS_MOUNT_PATH,
  SHELL_MOUNT_PATH,
  USAGE_DASHBOARD_MOUNT_PATH,
} from "./mount-paths";

export type MicroFrontendId = "shell" | "usage-dashboard" | "reports";

export interface MicroFrontendRoute {
  readonly id: MicroFrontendId;
  readonly navigationLabel: string;
  readonly description: string;
  readonly mountPath: string;
}

export const MICRO_FRONTEND_ROUTES: readonly MicroFrontendRoute[] = [
  {
    id: "shell",
    navigationLabel: "Home",
    description: "Platform overview and entry point.",
    mountPath: SHELL_MOUNT_PATH,
  },
  {
    id: "usage-dashboard",
    navigationLabel: "Claude usage",
    description: "Live Claude Code token usage and cost across machines.",
    mountPath: USAGE_DASHBOARD_MOUNT_PATH,
  },
  {
    id: "reports",
    navigationLabel: "Reports",
    description: "Generated reports hub.",
    mountPath: REPORTS_MOUNT_PATH,
  },
];

export function findMicroFrontendRoute(
  id: MicroFrontendId,
): MicroFrontendRoute {
  const route = MICRO_FRONTEND_ROUTES.find((candidate) => candidate.id === id);
  if (!route) {
    throw new Error(`no micro frontend route registered for id ${id}`);
  }
  return route;
}

export const CROSS_SECTION_NAVIGATION_ROUTES: readonly MicroFrontendRoute[] =
  MICRO_FRONTEND_ROUTES.filter((route) => route.id !== "shell");
