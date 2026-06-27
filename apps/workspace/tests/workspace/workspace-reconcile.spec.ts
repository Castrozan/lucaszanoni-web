import { describe, expect, it } from "vitest";
import { reconcileWorkspace } from "../../src/workspace/workspace-reconcile";
import type {
  CockpitWorkspaceSession,
  WorkspaceRegistryState,
} from "../../src/workspace/workspace-registry";

function session(
  key: string,
  windowIds: readonly string[],
  activeWindowId: string | null,
): CockpitWorkspaceSession {
  return {
    key,
    label: key,
    windows: windowIds.map((id) => ({
      id,
      title: id,
      driver: "claude" as const,
    })),
    activeWindowId,
  };
}

const persisted: WorkspaceRegistryState = {
  sessions: [
    session("platform", ["w1", "w2"], "w2"),
    session("infra", ["w3"], "w3"),
  ],
  activeSessionKey: "infra",
};

describe("workspace reconcile against live compute inventory", () => {
  it("prunes a persisted session that no longer exists on compute", () => {
    const live = [session("platform", ["w1", "w2"], "w1")];
    const result = reconcileWorkspace(persisted, live);
    expect(result.sessions.map((s) => s.key)).toEqual(["platform"]);
  });

  it("adopts a live session that was never persisted", () => {
    const live = [
      session("platform", ["w1", "w2"], "w1"),
      session("ops", ["w9"], "w9"),
    ];
    const result = reconcileWorkspace(persisted, live);
    expect(result.sessions.map((s) => s.key)).toEqual(["platform", "ops"]);
  });

  it("prunes a window that was closed externally and keeps live windows", () => {
    const live = [session("platform", ["w1"], "w1")];
    const result = reconcileWorkspace(persisted, live);
    expect(result.sessions[0]?.windows.map((w) => w.id)).toEqual(["w1"]);
  });

  it("preserves the persisted focus when it still exists on compute", () => {
    const live = [
      session("platform", ["w1", "w2"], "w1"),
      session("infra", ["w3"], "w3"),
    ];
    const result = reconcileWorkspace(persisted, live);
    expect(result.activeSessionKey).toBe("infra");
    expect(
      result.sessions.find((s) => s.key === "platform")?.activeWindowId,
    ).toBe("w2");
  });

  it("falls back focus to the first live session when persisted focus is gone", () => {
    const live = [session("platform", ["w1", "w2"], "w1")];
    const result = reconcileWorkspace(persisted, live);
    expect(result.activeSessionKey).toBe("platform");
  });

  it("falls back window focus to compute when the persisted window is gone", () => {
    const live = [session("platform", ["w2"], "w2")];
    const result = reconcileWorkspace(persisted, live);
    expect(result.sessions[0]?.activeWindowId).toBe("w2");
  });
});
