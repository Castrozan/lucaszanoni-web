import { WorkspaceMachineRouter } from "./WorkspaceMachineRouter";
import { resolveCockpitWorkspaceMachines } from "./workspace/cockpit-machine-endpoints";
import { resolveWorkspaceComputeForMachine } from "./workspace/resolve-workspace-compute";

export function WorkspaceEmbeddedPage() {
  return (
    <WorkspaceMachineRouter
      machines={resolveCockpitWorkspaceMachines()}
      storage={window.localStorage}
      createComputeForMachine={resolveWorkspaceComputeForMachine}
    />
  );
}
