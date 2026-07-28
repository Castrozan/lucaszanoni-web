import { BottomStatusBar, useKeybindRegistry } from "@platform/design-system";
import { windowJumpChordBytes } from "@platform/workspace";
import { useCockpitWorkspace } from "./cockpit-workspace-context";
import { buildCockpitStatusBarModel } from "./cockpit-status-bar-model";

export function CockpitStatusBar() {
  const cockpitWorkspace = useCockpitWorkspace();
  const registry = useKeybindRegistry();
  if (!cockpitWorkspace) {
    return <BottomStatusBar />;
  }
  const model = buildCockpitStatusBarModel(
    cockpitWorkspace.controller.state,
    (windowId, oneBasedWindowNumber) => {
      cockpitWorkspace.controller.selectWindow(windowId);
      const chordBytes = registry
        ? windowJumpChordBytes(registry.leader, oneBasedWindowNumber)
        : null;
      if (chordBytes) {
        cockpitWorkspace.attachedTerminalKeystrokeSender?.(chordBytes);
      }
    },
  );
  return <BottomStatusBar model={model} />;
}
