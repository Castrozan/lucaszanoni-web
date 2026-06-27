import { describe, expect, it } from "vitest";
import {
  emptyWorkspaceRegistry,
  reduceWorkspaceRegistry,
  type WorkspaceRegistryState,
} from "../../src/workspace/workspace-registry";

function withTwoDomains(): WorkspaceRegistryState {
  const one = reduceWorkspaceRegistry(emptyWorkspaceRegistry, {
    type: "sessionOpened",
    session: { key: "platform", label: "Platform" },
  });
  return reduceWorkspaceRegistry(one, {
    type: "sessionOpened",
    session: { key: "infra", label: "Infra" },
  });
}

describe("reduceWorkspaceRegistry session events", () => {
  it("opens a work-domain session and makes the first one active with no windows", () => {
    const state = reduceWorkspaceRegistry(emptyWorkspaceRegistry, {
      type: "sessionOpened",
      session: { key: "platform", label: "Platform" },
    });
    expect(state.sessions).toHaveLength(1);
    expect(state.sessions[0]?.windows).toEqual([]);
    expect(state.sessions[0]?.activeWindowId).toBeNull();
    expect(state.activeSessionKey).toBe("platform");
  });

  it("keeps the original session when a known key re-opens", () => {
    const seeded = withTwoDomains();
    const duplicate = reduceWorkspaceRegistry(seeded, {
      type: "sessionOpened",
      session: { key: "platform", label: "Renamed by re-open" },
    });
    expect(duplicate.sessions).toHaveLength(2);
    expect(duplicate.sessions.find((s) => s.key === "platform")?.label).toBe(
      "Platform",
    );
    expect(duplicate.activeSessionKey).toBe("platform");
  });

  it("selects an existing session and ignores an unknown key", () => {
    const seeded = withTwoDomains();
    const selected = reduceWorkspaceRegistry(seeded, {
      type: "sessionSelected",
      key: "infra",
    });
    expect(selected.activeSessionKey).toBe("infra");
    const ignored = reduceWorkspaceRegistry(selected, {
      type: "sessionSelected",
      key: "ghost",
    });
    expect(ignored.activeSessionKey).toBe("infra");
  });

  it("renames a session label without touching its key or the active selection", () => {
    const seeded = withTwoDomains();
    const renamed = reduceWorkspaceRegistry(seeded, {
      type: "sessionRenamed",
      key: "infra",
      label: "Infrastructure",
    });
    expect(renamed.sessions.find((s) => s.key === "infra")?.label).toBe(
      "Infrastructure",
    );
    expect(renamed.activeSessionKey).toBe("platform");
  });

  it("closes the active session and reassigns active to the first remaining", () => {
    const seeded = withTwoDomains();
    const closed = reduceWorkspaceRegistry(seeded, {
      type: "sessionClosed",
      key: "platform",
    });
    expect(closed.sessions.map((s) => s.key)).toEqual(["infra"]);
    expect(closed.activeSessionKey).toBe("infra");
  });

  it("clears the active session key when the last session closes", () => {
    const single = reduceWorkspaceRegistry(emptyWorkspaceRegistry, {
      type: "sessionOpened",
      session: { key: "platform", label: "Platform" },
    });
    const emptied = reduceWorkspaceRegistry(single, {
      type: "sessionClosed",
      key: "platform",
    });
    expect(emptied.sessions).toHaveLength(0);
    expect(emptied.activeSessionKey).toBeNull();
  });
});
