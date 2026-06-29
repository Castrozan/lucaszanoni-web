import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
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
  readonly machines: readonly CockpitWorkspaceMachine[];
  readonly activeMachine: CockpitWorkspaceMachine | null;
  readonly selectMachine: (machineKey: string) => void;
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
  const [activeMachineKey, setActiveMachineKey] = useState<string | null>(null);
  const activeMachine = resolveActiveCockpitWorkspaceMachine(
    machines,
    activeMachineKey,
  );
  return (
    <CockpitMachineController
      key={activeMachine?.key ?? "default"}
      storage={storage}
      machines={machines}
      activeMachine={activeMachine}
      createComputeForMachine={createComputeForMachine}
      selectMachine={setActiveMachineKey}
    >
      {children}
    </CockpitMachineController>
  );
}

interface CockpitMachineControllerProps {
  readonly children: ReactNode;
  readonly storage?: Storage;
  readonly machines: readonly CockpitWorkspaceMachine[];
  readonly activeMachine: CockpitWorkspaceMachine | null;
  readonly createComputeForMachine: typeof resolveWorkspaceComputeForMachine;
  readonly selectMachine: (machineKey: string) => void;
}

function CockpitMachineController({
  children,
  storage,
  machines,
  activeMachine,
  createComputeForMachine,
  selectMachine,
}: CockpitMachineControllerProps) {
  const createCompute = createComputeForMachine(activeMachine);
  const controller = useWorkspace({
    storage: storage ?? safeLocalStorage(),
    createCompute,
  });
  const value = useMemo<CockpitWorkspaceValue>(
    () => ({
      controller,
      machines,
      activeMachine,
      selectMachine,
      sessionTerminalMachineEndpoint:
        createCompute && activeMachine ? activeMachine.endpoint : null,
    }),
    [controller, machines, activeMachine, selectMachine, createCompute],
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
