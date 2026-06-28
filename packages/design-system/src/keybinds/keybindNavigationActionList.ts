import { MICRO_FRONTEND_ROUTES } from "@platform/config";

export interface KeybindNavigationAction {
  readonly id: string;
  readonly label: string;
  readonly defaultBinding: string;
  readonly href: string;
}

const NAVIGATION_LEADER_KEY_BY_ROUTE_ID: Record<string, string> = {
  cockpit: "c",
  workspace: "w",
  "usage-dashboard": "u",
  reports: "r",
  "dynamic-ia-canvas": "i",
  "dynamic-ia-interfaces": "n",
};

export function buildKeybindNavigationActions(): KeybindNavigationAction[] {
  const homeAction: KeybindNavigationAction = {
    id: "nav.home",
    label: "Go to Home",
    defaultBinding: "Leader g h",
    href: "/",
  };
  const appActions = MICRO_FRONTEND_ROUTES.filter(
    (route) => NAVIGATION_LEADER_KEY_BY_ROUTE_ID[route.id] !== undefined,
  ).map((route) => ({
    id: `nav.${route.id}`,
    label: `Go to ${route.navigationLabel}`,
    defaultBinding: `Leader g ${NAVIGATION_LEADER_KEY_BY_ROUTE_ID[route.id]}`,
    href: route.mountPath,
  }));
  return [homeAction, ...appActions];
}
