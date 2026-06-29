import { useMemo, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useLeaderKeyNavigation } from "../navigation/use-leader-key-navigation";
import { buildCockpitLeaderBindings } from "../navigation/leader-keymap";
import { dispatchCockpitLeaderCommand } from "../navigation/cockpit-leader-dispatch";
import { CommandPalette, useCommandPalette } from "@platform/design-system";
import {
  buildNavigationCommands,
  buildSessionCommands,
} from "../command-palette/cockpit-commands";
import { useCockpitSessionsContext } from "../sessions/cockpit-sessions-context";
import { useCockpitWorkspace } from "../tmux-mirror/cockpit-workspace-context";
import {
  buildCockpitMirrorMachineCommands,
  buildCockpitMirrorSessionCommands,
} from "../tmux-mirror/cockpit-mirror-palette-commands";

export interface CockpitShellProps {
  readonly children: ReactNode;
}

export function CockpitShell({ children }: CockpitShellProps) {
  const navigate = useNavigate();
  const { sessions, selectSession } = useCockpitSessionsContext();
  const cockpitWorkspace = useCockpitWorkspace();
  const paletteCommands = useMemo(
    () =>
      cockpitWorkspace
        ? [
            ...buildNavigationCommands(navigate),
            ...buildCockpitMirrorSessionCommands(cockpitWorkspace.controller),
            ...buildCockpitMirrorMachineCommands(
              cockpitWorkspace.machines,
              cockpitWorkspace.activeMachine?.key ?? null,
              cockpitWorkspace.selectMachine,
            ),
          ]
        : [
            ...buildNavigationCommands(navigate),
            ...buildSessionCommands(sessions, selectSession),
          ],
    [navigate, sessions, selectSession, cockpitWorkspace],
  );
  const commandPalette = useCommandPalette(paletteCommands);
  const leaderBindings = useMemo(
    () => buildCockpitLeaderBindings(cockpitWorkspace !== null),
    [cockpitWorkspace],
  );
  useLeaderKeyNavigation({
    bindings: leaderBindings,
    onCommand: (command) =>
      dispatchCockpitLeaderCommand(command, {
        navigate,
        openPalette: commandPalette.openPalette,
        controller: cockpitWorkspace?.controller ?? null,
        promptForSessionName: () =>
          typeof window === "undefined"
            ? null
            : window.prompt("New session name"),
      }),
  });
  return (
    <div
      className="flex h-screen flex-col"
      style={{ paddingBottom: "var(--app-status-bar-height, 2rem)" }}
    >
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-6">
        {children}
      </main>
      <CommandPalette controller={commandPalette} />
    </div>
  );
}
