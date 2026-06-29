import { BottomStatusBar } from "@platform/design-system";
import { useCockpitWorkspace } from "./cockpit-workspace-context";
import { buildCockpitStatusBarModel } from "./cockpit-status-bar-model";

export function CockpitStatusBar() {
  const cockpitWorkspace = useCockpitWorkspace();
  if (!cockpitWorkspace) {
    return <BottomStatusBar />;
  }
  const model = buildCockpitStatusBarModel(
    cockpitWorkspace.controller.state,
    (windowId) => {
      void cockpitWorkspace.controller.selectWindowOnHost(windowId);
    },
  );
  return <BottomStatusBar model={model} registerNavigationKeybinds={false} />;
}
