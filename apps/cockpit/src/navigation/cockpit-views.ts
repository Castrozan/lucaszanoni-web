export interface CockpitView {
  readonly id: string;
  readonly label: string;
  readonly path: string;
  readonly fillsViewport: boolean;
}

export const cockpitViews: readonly CockpitView[] = [
  { id: "dashboard", label: "Dashboard", path: "/", fillsViewport: false },
  { id: "terminal", label: "Terminal", path: "/terminal", fillsViewport: true },
  { id: "jarvis", label: "Jarvis", path: "/jarvis", fillsViewport: false },
  { id: "user", label: "User", path: "/user", fillsViewport: false },
];

export function findCockpitViewByPath(path: string): CockpitView | null {
  return cockpitViews.find((view) => view.path === path) ?? null;
}
