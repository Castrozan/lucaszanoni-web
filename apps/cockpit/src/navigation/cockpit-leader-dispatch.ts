import type { WorkspaceController } from "@platform/workspace";
import type { LeaderCommand } from "./leader-keymap";

const DEFAULT_AGENT_WINDOW_DRIVER = "claude" as const;

export interface CockpitLeaderDispatchDeps {
  readonly navigate: (path: string) => void;
  readonly openPalette: () => void;
  readonly controller: Pick<
    WorkspaceController,
    "openSession" | "openWindow"
  > | null;
  readonly promptForSessionName: () => string | null;
}

export function dispatchCockpitLeaderCommand(
  command: LeaderCommand,
  deps: CockpitLeaderDispatchDeps,
): void {
  switch (command.kind) {
    case "navigate-view":
      deps.navigate(command.path);
      return;
    case "open-command-palette":
    case "choose-session":
    case "choose-machine":
      deps.openPalette();
      return;
    case "new-session": {
      const requestedName = deps.promptForSessionName()?.trim();
      if (requestedName && deps.controller) {
        void deps.controller.openSession(requestedName);
      }
      return;
    }
    case "new-agent-window":
      if (deps.controller) {
        void deps.controller.openWindow(DEFAULT_AGENT_WINDOW_DRIVER);
      }
      return;
  }
}
