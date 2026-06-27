import { describe, expect, it } from "vitest";
import {
  emptyWorkspaceRegistry,
  reduceWorkspaceRegistry,
  type WorkspaceRegistryState,
} from "../../src/workspace/workspace-registry";

function withPlatformDomain(): WorkspaceRegistryState {
  return reduceWorkspaceRegistry(emptyWorkspaceRegistry, {
    type: "sessionOpened",
    session: { key: "platform", label: "Platform" },
  });
}

function withTwoWindows(): WorkspaceRegistryState {
  const first = reduceWorkspaceRegistry(withPlatformDomain(), {
    type: "windowOpened",
    sessionKey: "platform",
    window: { id: "w1", title: "claude", driver: "claude" },
  });
  return reduceWorkspaceRegistry(first, {
    type: "windowOpened",
    sessionKey: "platform",
    window: { id: "w2", title: "codex", driver: "codex" },
  });
}

describe("reduceWorkspaceRegistry window events", () => {
  it("opens an agent window into a session and makes it the active window", () => {
    const opened = reduceWorkspaceRegistry(withPlatformDomain(), {
      type: "windowOpened",
      sessionKey: "platform",
      window: { id: "w1", title: "claude", driver: "claude" },
    });
    const platform = opened.sessions.find((s) => s.key === "platform");
    expect(platform?.windows).toEqual([
      { id: "w1", title: "claude", driver: "claude" },
    ]);
    expect(platform?.activeWindowId).toBe("w1");
  });

  it("ignores opening a window into an unknown session", () => {
    const seeded = withPlatformDomain();
    const ignored = reduceWorkspaceRegistry(seeded, {
      type: "windowOpened",
      sessionKey: "ghost",
      window: { id: "w1", title: "claude", driver: "claude" },
    });
    expect(ignored).toEqual(seeded);
  });

  it("keeps the original window when a known window id re-opens", () => {
    const seeded = reduceWorkspaceRegistry(withPlatformDomain(), {
      type: "windowOpened",
      sessionKey: "platform",
      window: { id: "w1", title: "claude", driver: "claude" },
    });
    const duplicate = reduceWorkspaceRegistry(seeded, {
      type: "windowOpened",
      sessionKey: "platform",
      window: { id: "w1", title: "codex", driver: "codex" },
    });
    const platform = duplicate.sessions.find((s) => s.key === "platform");
    expect(platform?.windows).toHaveLength(1);
    expect(platform?.windows[0]?.driver).toBe("claude");
  });

  it("selects an existing window and ignores an unknown window id", () => {
    const seeded = withTwoWindows();
    const selected = reduceWorkspaceRegistry(seeded, {
      type: "windowSelected",
      sessionKey: "platform",
      windowId: "w1",
    });
    expect(
      selected.sessions.find((s) => s.key === "platform")?.activeWindowId,
    ).toBe("w1");
    const ignored = reduceWorkspaceRegistry(selected, {
      type: "windowSelected",
      sessionKey: "platform",
      windowId: "ghost",
    });
    expect(
      ignored.sessions.find((s) => s.key === "platform")?.activeWindowId,
    ).toBe("w1");
  });

  it("closes the active window and reassigns active to the first remaining", () => {
    const closed = reduceWorkspaceRegistry(withTwoWindows(), {
      type: "windowClosed",
      sessionKey: "platform",
      windowId: "w2",
    });
    const platform = closed.sessions.find((s) => s.key === "platform");
    expect(platform?.windows.map((w) => w.id)).toEqual(["w1"]);
    expect(platform?.activeWindowId).toBe("w1");
  });

  it("clears the active window id when the last window of a session closes", () => {
    const seeded = reduceWorkspaceRegistry(withPlatformDomain(), {
      type: "windowOpened",
      sessionKey: "platform",
      window: { id: "w1", title: "claude", driver: "claude" },
    });
    const closed = reduceWorkspaceRegistry(seeded, {
      type: "windowClosed",
      sessionKey: "platform",
      windowId: "w1",
    });
    const platform = closed.sessions.find((s) => s.key === "platform");
    expect(platform?.windows).toEqual([]);
    expect(platform?.activeWindowId).toBeNull();
  });
});
