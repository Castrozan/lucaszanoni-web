import { describe, expect, it, vi } from "vitest";
import { buildCockpitMirrorSessionCommands } from "../src/tmux-mirror/cockpit-mirror-palette-commands";
import type { WorkspaceController } from "@platform/workspace";

function controllerWithSessions(): WorkspaceController {
  return {
    state: {
      activeSessionKey: "dotfiles",
      sessions: [
        {
          key: "dotfiles",
          label: "dotfiles",
          activeWindowId: null,
          windows: [],
        },
        { key: "todos", label: "todos", activeWindowId: null, windows: [] },
      ],
    },
    selectSession: vi.fn(),
  } as unknown as WorkspaceController;
}

describe("buildCockpitMirrorSessionCommands", () => {
  it("emits one switch command per live session", () => {
    const controller = controllerWithSessions();
    const commands = buildCockpitMirrorSessionCommands(controller);

    expect(commands.map((command) => command.title)).toEqual([
      "Session: dotfiles",
      "Session: todos",
    ]);
  });

  it("switches to the chosen session when a command runs", () => {
    const controller = controllerWithSessions();
    const commands = buildCockpitMirrorSessionCommands(controller);

    commands.find((command) => command.id === "mirror-session:todos")?.run();

    expect(controller.selectSession).toHaveBeenCalledWith("todos");
  });
});
