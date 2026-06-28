export interface CockpitView {
  readonly id: string;
  readonly label: string;
  readonly path: string;
}

export const cockpitViews: readonly CockpitView[] = [
  { id: "workspace", label: "Workspace", path: "/" },
  { id: "dashboard", label: "Dashboard", path: "/dashboard" },
  { id: "jarvis", label: "Jarvis", path: "/jarvis" },
  { id: "user", label: "User", path: "/user" },
];
