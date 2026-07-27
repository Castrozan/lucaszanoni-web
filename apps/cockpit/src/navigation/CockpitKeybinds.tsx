import { useKeybind } from "@platform/design-system";
import type { WorkspaceController } from "@platform/workspace";
import { cockpitViews } from "./cockpit-views";
import { CockpitViewKeybind } from "./CockpitViewKeybind";

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
  useKeybind({
    id: "cockpit.palette",
    label: "Open the command palette",
    defaultBinding: "Leader k",
    run: openPalette,
  });
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
  useKeybind({
    id: "cockpit.machine.choose",
    label: "Switch machine",
    defaultBinding: "Leader d",
    run: openPalette,
  });
  useKeybind({
    id: "cockpit.session.new",
    label: "Create a new session",
    defaultBinding: "Leader Shift+s",
    run: () => {
      const requestedName = promptForSessionName()?.trim();
      if (requestedName) {
        void controller.openSession(requestedName);
      }
    },
  });
  useKeybind({
    id: "cockpit.window.new",
    label: "Open a new agent window",
    defaultBinding: "Leader c",
    run: () => void controller.openWindow(DEFAULT_AGENT_WINDOW_DRIVER),
  });
  return null;
}
