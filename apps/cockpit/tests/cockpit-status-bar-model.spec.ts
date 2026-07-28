import { describe, expect, it, vi } from "vitest";
import { buildCockpitStatusBarModel } from "../src/workspace/cockpit-status-bar-model";
import type { WorkspaceRegistryState } from "@platform/workspace";

const liveState: WorkspaceRegistryState = {
  activeSessionKey: "dotfiles",
  sessions: [
    {
      key: "dotfiles",
      label: "dotfiles",
      activeWindowId: "@1",
      windows: [
        { id: "@1", title: "claude", driver: "claude", terminalIdentifier: "" },
        { id: "@2", title: "codex", driver: "codex", terminalIdentifier: "" },
      ],
    },
    {
      key: "todos",
      label: "todos",
      activeWindowId: "@9",
      windows: [{ id: "@9", title: "shell", driver: "claude", terminalIdentifier: "" }],
    },
  ],
};

describe("buildCockpitStatusBarModel", () => {
  it("renders the active session label and its windows with the active one flagged", () => {
    const model = buildCockpitStatusBarModel(liveState, () => {});

    expect(model.sessionLabel).toBe("dotfiles");
    expect(model.windows.map((w) => [w.id, w.label, w.isActive])).toEqual([
      ["@1", "claude", true],
      ["@2", "codex", false],
    ]);
  });

  it("wires each window's onSelect to its own identifier", () => {
    const onSelectWindow = vi.fn();
    const model = buildCockpitStatusBarModel(liveState, onSelectWindow);

    const codexWindow = model.windows.find((w) => w.id === "@2");
    if (codexWindow?.kind !== "action") {
      throw new Error("cockpit windows must be selectable actions");
    }
    codexWindow.onSelect();

    expect(onSelectWindow).toHaveBeenCalledWith("@2");
  });

  it("falls back to a Cockpit label with no windows when nothing is active", () => {
    const model = buildCockpitStatusBarModel(
      { activeSessionKey: null, sessions: [] },
      () => {},
    );

    expect(model.sessionLabel).toBe("Cockpit");
    expect(model.windows).toEqual([]);
  });
});
