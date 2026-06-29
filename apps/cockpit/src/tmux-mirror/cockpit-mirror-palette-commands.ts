import type {
  CockpitWorkspaceMachine,
  WorkspaceController,
} from "@platform/workspace";
import type { CockpitCommand } from "../command-palette/use-command-palette";

export function buildCockpitMirrorSessionCommands(
  controller: WorkspaceController,
): CockpitCommand[] {
  return controller.state.sessions.map((session) => ({
    id: `mirror-session:${session.key}`,
    title: `Session: ${session.label}`,
    run: () => controller.selectSession(session.key),
  }));
}

export function buildCockpitMirrorMachineCommands(
  machines: readonly CockpitWorkspaceMachine[],
  activeMachineKey: string | null,
  selectMachine: (machineKey: string) => void,
): CockpitCommand[] {
  return machines.map((machine) => ({
    id: `mirror-machine:${machine.key}`,
    title: `Machine: ${machine.label}${
      machine.key === activeMachineKey ? " (active)" : ""
    }`,
    run: () => selectMachine(machine.key),
  }));
}
