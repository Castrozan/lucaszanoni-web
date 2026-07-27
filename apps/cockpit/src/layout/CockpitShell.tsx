import { useMemo, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CockpitKeybinds } from "../navigation/CockpitKeybinds";
import { CommandPalette, useCommandPalette } from "@platform/design-system";
import { buildNavigationCommands } from "../command-palette/cockpit-commands";
import { findCockpitViewByPath } from "../navigation/cockpit-views";
import { useCockpitWorkspace } from "../workspace/cockpit-workspace-context";
import {
  buildCockpitWorkspaceMachineCommands,
  buildCockpitWorkspaceSessionCommands,
} from "../workspace/cockpit-workspace-palette-commands";

export interface CockpitShellProps {
  readonly children: ReactNode;
}

export function CockpitShell({ children }: CockpitShellProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const cockpitWorkspace = useCockpitWorkspace();
  const paletteCommands = useMemo(
    () =>
      cockpitWorkspace
        ? [
            ...buildNavigationCommands(navigate),
            ...buildCockpitWorkspaceSessionCommands(
              cockpitWorkspace.controller,
            ),
            ...buildCockpitWorkspaceMachineCommands(
              cockpitWorkspace.machines,
              cockpitWorkspace.activeMachine?.key ?? null,
              cockpitWorkspace.selectMachine,
            ),
          ]
        : buildNavigationCommands(navigate),
    [navigate, cockpitWorkspace],
  );
  const commandPalette = useCommandPalette(paletteCommands);
  const routedSurfaceClassName = findCockpitViewByPath(pathname)?.fillsViewport
    ? "flex min-h-0 flex-1 flex-col"
    : "flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-6";
  return (
    <div
      className="flex h-screen flex-col"
      style={{ paddingBottom: "var(--app-status-bar-height, 2rem)" }}
    >
      <CockpitKeybinds
        navigate={navigate}
        openPalette={commandPalette.openPalette}
        controller={cockpitWorkspace?.controller ?? null}
      />
      <main className={routedSurfaceClassName}>{children}</main>
      <CommandPalette controller={commandPalette} />
    </div>
  );
}
