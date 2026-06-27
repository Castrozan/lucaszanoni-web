import { useState } from "react";
import { WorkspacePage } from "./WorkspacePage";
import { WorkspaceMachineSwitcher } from "./workspace/WorkspaceMachineSwitcher";
import {
  resolveActiveCockpitWorkspaceMachine,
  type CockpitWorkspaceMachine,
} from "./workspace/cockpit-machine-endpoints";
import type { CockpitComputePort } from "./workspace/compute-port";
import type { WorkspaceRegistryState } from "./workspace/workspace-registry";

export type WorkspaceComputeFactory = (
  seed: WorkspaceRegistryState,
) => CockpitComputePort;

export interface WorkspaceMachineRouterProps {
  machines: readonly CockpitWorkspaceMachine[];
  storage: Storage;
  createComputeForMachine: (
    machine: CockpitWorkspaceMachine | null,
  ) => WorkspaceComputeFactory | undefined;
}

export function WorkspaceMachineRouter({
  machines,
  storage,
  createComputeForMachine,
}: WorkspaceMachineRouterProps) {
  const [activeMachineKey, setActiveMachineKey] = useState<string | null>(null);
  const activeMachine = resolveActiveCockpitWorkspaceMachine(
    machines,
    activeMachineKey,
  );
  return (
    <>
      <WorkspaceMachineSwitcher
        machines={machines}
        activeKey={activeMachine?.key ?? null}
        onSelect={setActiveMachineKey}
      />
      <WorkspacePage
        key={activeMachine?.key ?? "default"}
        storage={storage}
        createCompute={createComputeForMachine(activeMachine)}
      />
    </>
  );
}
