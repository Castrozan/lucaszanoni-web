import {
  createContext,
  useCallback,
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

export type CockpitTerminalKeystrokeSender = (bytes: Uint8Array) => void;

export interface CockpitWorkspaceValue {
  readonly controller: WorkspaceController;
  readonly machines: readonly CockpitWorkspaceMachine[];
  readonly activeMachine: CockpitWorkspaceMachine | null;
  readonly selectMachine: (machineKey: string) => void;
  readonly sessionTerminalMachineEndpoint: string | null;
  readonly attachedTerminalKeystrokeSender: CockpitTerminalKeystrokeSender | null;
  readonly publishAttachedTerminalKeystrokeSender: (
    sender: CockpitTerminalKeystrokeSender | null,
  ) => void;
}

const CockpitWorkspaceContext = createContext<CockpitWorkspaceValue | null>(
  null,
);

export function useCockpitWorkspace(): CockpitWorkspaceValue | null {
  return useContext(CockpitWorkspaceContext);
}

export interface CockpitWorkspaceProviderProps {
  readonly children: ReactNode;
  readonly storage?: Storage;
  readonly machines?: readonly CockpitWorkspaceMachine[];
  readonly createComputeForMachine?: typeof resolveWorkspaceComputeForMachine;
}

export function CockpitWorkspaceProvider({
  children,
  storage,
  machines = resolveCockpitWorkspaceMachines(),
  createComputeForMachine = resolveWorkspaceComputeForMachine,
}: CockpitWorkspaceProviderProps) {
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
  const [attachedTerminalKeystrokeSender, setAttachedTerminalKeystrokeSender] =
    useState<CockpitTerminalKeystrokeSender | null>(null);
  const publishAttachedTerminalKeystrokeSender = useCallback(
    (sender: CockpitTerminalKeystrokeSender | null) =>
      setAttachedTerminalKeystrokeSender(() => sender),
    [],
  );
  const value = useMemo<CockpitWorkspaceValue>(
    () => ({
      controller,
      machines,
      activeMachine,
      selectMachine,
      sessionTerminalMachineEndpoint:
        createCompute && activeMachine ? activeMachine.endpoint : null,
      attachedTerminalKeystrokeSender,
      publishAttachedTerminalKeystrokeSender,
    }),
    [
      controller,
      machines,
      activeMachine,
      selectMachine,
      createCompute,
      attachedTerminalKeystrokeSender,
      publishAttachedTerminalKeystrokeSender,
    ],
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
