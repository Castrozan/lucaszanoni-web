import { useKeybind } from "@platform/design-system";
import type { WorkspaceController } from "@platform/workspace";
import { cockpitViews } from "./cockpit-views";
import { CockpitViewKeybind } from "./CockpitViewKeybind";
import {
  CHOOSE_MACHINE_KEYBIND,
  COMMAND_PALETTE_KEYBIND,
  NEW_AGENT_WINDOW_KEYBIND,
  NEW_SESSION_KEYBIND,
} from "./cockpit-workspace-keybind-declarations";

const DEFAULT_AGENT_WINDOW_DRIVER = "claude" as const;

export interface CockpitKeybindsProps {
  readonly navigate: (path: string) => void;
  readonly openPalette: () => void;
  readonly controller: Pick<
    WorkspaceController,
    "openSession" | "openWindow"
  > | null;
  readonly promptForSessionName?: () => string | null;
}

function promptForSessionNameInBrowser(): string | null {
  return typeof window === "undefined"
    ? null
    : window.prompt("New session name");
}

export function CockpitKeybinds({
  navigate,
  openPalette,
  controller,
  promptForSessionName = promptForSessionNameInBrowser,
}: CockpitKeybindsProps) {
  useKeybind({ ...COMMAND_PALETTE_KEYBIND, run: openPalette });
  return (
    <>
      {cockpitViews.map((view) => (
        <CockpitViewKeybind key={view.id} view={view} navigate={navigate} />
      ))}
      {controller ? (
        <CockpitWorkspaceKeybinds
          openPalette={openPalette}
          controller={controller}
          promptForSessionName={promptForSessionName}
        />
      ) : null}
    </>
  );
}

interface CockpitWorkspaceKeybindsProps {
  readonly openPalette: () => void;
  readonly controller: Pick<WorkspaceController, "openSession" | "openWindow">;
  readonly promptForSessionName: () => string | null;
}

function CockpitWorkspaceKeybinds({
  openPalette,
  controller,
  promptForSessionName,
}: CockpitWorkspaceKeybindsProps) {
  useKeybind({ ...CHOOSE_MACHINE_KEYBIND, run: openPalette });
  useKeybind({
    ...NEW_SESSION_KEYBIND,
    run: () => {
      const requestedName = promptForSessionName()?.trim();
      if (requestedName) {
        void controller.openSession(requestedName);
      }
    },
  });
  useKeybind({
    ...NEW_AGENT_WINDOW_KEYBIND,
    run: () => void controller.openWindow(DEFAULT_AGENT_WINDOW_DRIVER),
  });
  return null;
}
