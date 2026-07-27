import type { PaletteCommand } from "@platform/design-system";
import type {
  CockpitWorkspaceMachine,
  WorkspaceController,
} from "@platform/workspace";

export function buildCockpitWorkspaceSessionCommands(
  controller: WorkspaceController,
): PaletteCommand[] {
  return controller.state.sessions.map((session) => ({
    id: `workspace-session:${session.key}`,
    title: `Session: ${session.label}`,
    run: () => controller.selectSession(session.key),
  }));
}

export function buildCockpitWorkspaceMachineCommands(
  machines: readonly CockpitWorkspaceMachine[],
  activeMachineKey: string | null,
  selectMachine: (machineKey: string) => void,
): PaletteCommand[] {
  return machines.map((machine) => ({
    id: `workspace-machine:${machine.key}`,
    title: `Machine: ${machine.label}${
      machine.key === activeMachineKey ? " (active)" : ""
    }`,
    run: () => selectMachine(machine.key),
  }));
}
