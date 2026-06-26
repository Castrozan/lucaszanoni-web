import { describe, expect, it, vi } from "vitest";
import { buildNavigationCommands } from "../src/command-palette/cockpit-commands";
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
