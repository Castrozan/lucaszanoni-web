import { ThemeProvider, CommandPalette } from "@platform/design-system";
import { WorkspaceMachineRouter } from "./WorkspaceMachineRouter";
import { resolveCockpitWorkspaceMachines } from "./workspace/cockpit-machine-endpoints";
import { resolveWorkspaceComputeForMachine } from "./workspace/resolve-workspace-compute";

export function WorkspaceRoot() {
  return (
    <ThemeProvider>
      <WorkspaceMachineRouter
        machines={resolveCockpitWorkspaceMachines()}
        storage={window.localStorage}
        createComputeForMachine={resolveWorkspaceComputeForMachine}
      />
      <CommandPalette />
    </ThemeProvider>
  );
}
