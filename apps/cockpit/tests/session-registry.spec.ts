import { describe, expect, it } from "vitest";
import {
  emptySessionRegistry,
  reduceSessionRegistry,
  type SessionRegistryState,
} from "../src/sessions/session-registry";

function withTwoSessions(): SessionRegistryState {
  const one = reduceSessionRegistry(emptySessionRegistry, {
    type: "registered",
    session: { key: "global", label: "Jarvis" },
  });
  return reduceSessionRegistry(one, {
    type: "registered",
    session: { key: "build", label: "Build" },
  });
}

describe("reduceSessionRegistry", () => {
  it("registers a session and makes the first one active", () => {
    const state = reduceSessionRegistry(emptySessionRegistry, {
      type: "registered",
      session: { key: "global", label: "Jarvis" },
    });
    expect(state.sessions).toEqual([{ key: "global", label: "Jarvis" }]);
    expect(state.activeKey).toBe("global");
  });

  it("keeps the original entry and active key when a known key re-registers", () => {
    const seeded = withTwoSessions();
    const duplicate = reduceSessionRegistry(seeded, {
      type: "registered",
      session: { key: "global", label: "Renamed by re-register" },
    });
    expect(duplicate.sessions).toHaveLength(2);
    expect(duplicate.sessions.find((s) => s.key === "global")?.label).toBe(
      "Jarvis",
    );
    expect(duplicate.activeKey).toBe("global");
  });

  it("selects an existing session and ignores an unknown key", () => {
    const seeded = withTwoSessions();
    const selected = reduceSessionRegistry(seeded, {
      type: "selected",
      key: "build",
    });
    expect(selected.activeKey).toBe("build");
    const ignored = reduceSessionRegistry(selected, {
      type: "selected",
      key: "ghost",
    });
    expect(ignored.activeKey).toBe("build");
  });

  it("renames a session label without touching its key or the active selection", () => {
    const seeded = withTwoSessions();
    const renamed = reduceSessionRegistry(seeded, {
      type: "renamed",
      key: "build",
      label: "CI build",
    });
    expect(renamed.sessions.find((s) => s.key === "build")?.label).toBe(
      "CI build",
    );
    expect(renamed.activeKey).toBe("global");
  });

  it("removes the active session and reassigns active to the first remaining", () => {
    const seeded = withTwoSessions();
    const removed = reduceSessionRegistry(seeded, {
      type: "removed",
      key: "global",
    });
    expect(removed.sessions.map((s) => s.key)).toEqual(["build"]);
    expect(removed.activeKey).toBe("build");
  });

  it("clears the active key when the last session is removed", () => {
    const single = reduceSessionRegistry(emptySessionRegistry, {
      type: "registered",
      session: { key: "global", label: "Jarvis" },
    });
    const emptied = reduceSessionRegistry(single, {
      type: "removed",
      key: "global",
    });
    expect(emptied.sessions).toHaveLength(0);
    expect(emptied.activeKey).toBeNull();
  });
});
