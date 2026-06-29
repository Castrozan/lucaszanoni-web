import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  resolveActiveCockpitWorkspaceMachine,
  resolveCockpitWorkspaceMachines,
  resolveWorkspaceComputeForMachine,
  useWorkspace,
  type CockpitWorkspaceMachine,
  type WorkspaceController,
} from "@platform/workspace";
import { isCockpitTmuxMirrorEnabled } from "./cockpit-tmux-mirror-flag";

export interface CockpitWorkspaceValue {
  readonly controller: WorkspaceController;
  readonly activeMachine: CockpitWorkspaceMachine | null;
  readonly sessionTerminalMachineEndpoint: string | null;
}

const CockpitWorkspaceContext = createContext<CockpitWorkspaceValue | null>(
  null,
);

export function useCockpitWorkspace(): CockpitWorkspaceValue | null {
  return useContext(CockpitWorkspaceContext);
}

export interface CockpitWorkspaceProviderProps {
  readonly children: ReactNode;
  readonly enabled?: boolean;
  readonly storage?: Storage;
  readonly machines?: readonly CockpitWorkspaceMachine[];
  readonly createComputeForMachine?: typeof resolveWorkspaceComputeForMachine;
}

export function CockpitWorkspaceProvider({
  children,
  enabled = isCockpitTmuxMirrorEnabled(),
  ...liveOptions
}: CockpitWorkspaceProviderProps) {
  if (!enabled) {
    return (
      <CockpitWorkspaceContext.Provider value={null}>
        {children}
      </CockpitWorkspaceContext.Provider>
    );
  }
  return (
    <CockpitWorkspaceLiveProvider {...liveOptions}>
      {children}
    </CockpitWorkspaceLiveProvider>
  );
}

type CockpitWorkspaceLiveProviderProps = Omit<
  CockpitWorkspaceProviderProps,
  "enabled"
>;

function CockpitWorkspaceLiveProvider({
  children,
  storage,
  machines = resolveCockpitWorkspaceMachines(),
  createComputeForMachine = resolveWorkspaceComputeForMachine,
}: CockpitWorkspaceLiveProviderProps) {
  const activeMachine = resolveActiveCockpitWorkspaceMachine(machines, null);
  const createCompute = createComputeForMachine(activeMachine);
  const controller = useWorkspace({
    storage: storage ?? safeLocalStorage(),
    createCompute,
  });
  const value = useMemo<CockpitWorkspaceValue>(
    () => ({
      controller,
      activeMachine,
      sessionTerminalMachineEndpoint:
        createCompute && activeMachine ? activeMachine.endpoint : null,
    }),
    [controller, activeMachine, createCompute],
  );
  return (
    <CockpitWorkspaceContext.Provider value={value}>
      {children}
    </CockpitWorkspaceContext.Provider>
  );
}

function safeLocalStorage(): Storage | undefined {
  return typeof window === "undefined" ? undefined : window.localStorage;
}
