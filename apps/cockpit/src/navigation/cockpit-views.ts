export interface CockpitView {
  readonly id: string;
  readonly label: string;
  readonly path: string;
}

export const cockpitViews: readonly CockpitView[] = [
  { id: "dashboard", label: "Dashboard", path: "/" },
  { id: "jarvis", label: "Jarvis", path: "/jarvis" },
  { id: "user", label: "User", path: "/user" },
];
