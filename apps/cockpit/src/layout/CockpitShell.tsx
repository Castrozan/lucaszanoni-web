import { useMemo, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useLeaderKeyNavigation } from "../navigation/use-leader-key-navigation";
import {
  buildNavigationCommands,
  buildSessionCommands,
} from "../command-palette/cockpit-commands";
import { useCommandPalette } from "../command-palette/use-command-palette";
import { CommandPalette } from "../command-palette/CommandPalette";
import { useCockpitSessionsContext } from "../sessions/cockpit-sessions-context";

export interface CockpitShellProps {
  readonly children: ReactNode;
}

export function CockpitShell({ children }: CockpitShellProps) {
  const navigate = useNavigate();
  const { sessions, selectSession } = useCockpitSessionsContext();
  const paletteCommands = useMemo(
    () => [
      ...buildNavigationCommands(navigate),
      ...buildSessionCommands(sessions, selectSession),
    ],
    [navigate, sessions, selectSession],
  );
  const commandPalette = useCommandPalette(paletteCommands);
  useLeaderKeyNavigation({
    onCommand: (command) => {
      switch (command.kind) {
        case "navigate-view":
          navigate(command.path);
          return;
        case "open-command-palette":
          commandPalette.openPalette();
          return;
      }
    },
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
