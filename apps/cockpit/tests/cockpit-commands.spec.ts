import { describe, expect, it, vi } from "vitest";
import {
  buildNavigationCommands,
  buildSessionCommands,
} from "../src/command-palette/cockpit-commands";
import { cockpitViews } from "../src/navigation/cockpit-views";

describe("buildNavigationCommands", () => {
  it("builds one navigation command per cockpit view", () => {
    const commands = buildNavigationCommands(vi.fn());
    expect(commands.map((command) => command.id)).toEqual(
      cockpitViews.map((view) => `view:${view.id}`),
    );
  });

  it("titles each command after its destination view", () => {
    const commands = buildNavigationCommands(vi.fn());
    expect(commands.map((command) => command.title)).toEqual([
      "Go to Workspace",
      "Go to Dashboard",
      "Go to Jarvis",
      "Go to User",
    ]);
  });

  it("navigates to the view path when a command runs", () => {
    const navigate = vi.fn();
    const commands = buildNavigationCommands(navigate);
    const jarvisCommand = commands.find(
      (command) => command.id === "view:jarvis",
    );
    jarvisCommand?.run();
    expect(navigate).toHaveBeenCalledWith("/jarvis");
  });
});

describe("buildSessionCommands", () => {
  const sessions = [
    { key: "alpha", label: "Alpha" },
    { key: "beta", label: "Beta" },
  ];

  it("builds one switch command per session", () => {
    const commands = buildSessionCommands(sessions, vi.fn());
    expect(commands.map((command) => command.id)).toEqual([
      "session:alpha",
      "session:beta",
    ]);
    expect(commands.map((command) => command.title)).toEqual([
      "Switch to Alpha",
      "Switch to Beta",
    ]);
  });

  it("selects the session key when a command runs", () => {
    const selectSession = vi.fn();
    const commands = buildSessionCommands(sessions, selectSession);
    commands[1]?.run();
    expect(selectSession).toHaveBeenCalledWith("beta");
  });
});
