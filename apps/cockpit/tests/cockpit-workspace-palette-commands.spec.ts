import { describe, expect, it, vi } from "vitest";
import {
  buildCockpitWorkspaceMachineCommands,
  buildCockpitWorkspaceSessionCommands,
} from "../src/workspace/cockpit-workspace-palette-commands";
import type {
  CockpitWorkspaceMachine,
  WorkspaceController,
} from "@platform/workspace";

const machines: readonly CockpitWorkspaceMachine[] = [
  { key: "chise", label: "chise", endpoint: "wss://x/cockpit/lifecycle" },
  {
    key: "kira",
    label: "kira",
    endpoint: "wss://x/cockpit/kira-session/lifecycle",
  },
];

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

describe("buildCockpitWorkspaceSessionCommands", () => {
  it("emits one switch command per live session", () => {
    const controller = controllerWithSessions();
    const commands = buildCockpitWorkspaceSessionCommands(controller);

    expect(commands.map((command) => command.title)).toEqual([
      "Session: dotfiles",
      "Session: todos",
    ]);
  });

  it("switches to the chosen session when a command runs", () => {
    const controller = controllerWithSessions();
    const commands = buildCockpitWorkspaceSessionCommands(controller);

    commands.find((command) => command.id === "workspace-session:todos")?.run();

    expect(controller.selectSession).toHaveBeenCalledWith("todos");
  });
});

describe("buildCockpitWorkspaceMachineCommands", () => {
  it("emits one command per machine and marks the active one", () => {
    const commands = buildCockpitWorkspaceMachineCommands(
      machines,
      "chise",
      vi.fn(),
    );

    expect(commands.map((command) => command.title)).toEqual([
      "Machine: chise (active)",
      "Machine: kira",
    ]);
  });

  it("switches to the chosen machine when a command runs", () => {
    const selectMachine = vi.fn();
    const commands = buildCockpitWorkspaceMachineCommands(
      machines,
      "chise",
      selectMachine,
    );

    commands.find((command) => command.id === "workspace-machine:kira")?.run();

    expect(selectMachine).toHaveBeenCalledWith("kira");
  });
});
