import type { WorkspaceController } from "@platform/workspace";
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
