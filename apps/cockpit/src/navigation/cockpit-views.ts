export interface CockpitView {
  readonly id: string;
  readonly label: string;
  readonly path: string;
  readonly fillsViewport: boolean;
  readonly leaderKey: string;
}

export const COCKPIT_TERMINAL_VIEW_PATH = "/terminal";

export const cockpitViews: readonly CockpitView[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/",
    fillsViewport: false,
    leaderKey: "d",
  },
  {
    id: "terminal",
    label: "Terminal",
    path: COCKPIT_TERMINAL_VIEW_PATH,
    fillsViewport: true,
    leaderKey: "t",
  },
  {
    id: "jarvis",
    label: "Jarvis",
    path: "/jarvis",
    fillsViewport: false,
    leaderKey: "j",
  },
  {
    id: "user",
    label: "User",
    path: "/user",
    fillsViewport: false,
    leaderKey: "o",
  },
];

export function findCockpitViewByPath(path: string): CockpitView | null {
  return cockpitViews.find((view) => view.path === path) ?? null;
}
