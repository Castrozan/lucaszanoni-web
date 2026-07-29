import { useLocation } from "react-router-dom";
import {
  BottomStatusBar,
  buildPlatformStatusBarModel,
} from "@platform/design-system";
import { COCKPIT_MOUNT_PATH } from "@platform/config";
import { useCockpitWorkspace } from "./cockpit-workspace-context";
import { buildCockpitStatusBarModel } from "./cockpit-status-bar-model";
import { COCKPIT_TERMINAL_VIEW_PATH } from "../navigation/cockpit-views";

function absolutePathnameForCockpitView(routerPathname: string): string {
  return `${COCKPIT_MOUNT_PATH}${routerPathname.replace(/^\//, "")}`;
}

export function CockpitStatusBar() {
  const { pathname } = useLocation();
  const cockpitWorkspace = useCockpitWorkspace();
  if (pathname !== COCKPIT_TERMINAL_VIEW_PATH || !cockpitWorkspace) {
    return (
      <BottomStatusBar
        model={buildPlatformStatusBarModel(
          absolutePathnameForCockpitView(pathname),
        )}
      />
    );
  }
  const model = buildCockpitStatusBarModel(
    cockpitWorkspace.controller.state,
    (windowId) => cockpitWorkspace.controller.selectWindow(windowId),
  );
  return <BottomStatusBar model={model} registerNavigationKeybinds={false} />;
}
