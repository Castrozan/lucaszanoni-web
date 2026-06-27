import { describe, expect, it } from "vitest";
import {
  loadPersistedWorkspace,
  savePersistedWorkspace,
} from "../../src/workspace/workspace-registry-persistence";
import type { WorkspaceRegistryState } from "../../src/workspace/workspace-registry";

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key) => map.get(key) ?? null,
    key: (index) => [...map.keys()][index] ?? null,
    removeItem: (key) => {
      map.delete(key);
    },
    setItem: (key, value) => {
      map.set(key, value);
    },
  };
}

const seeded: WorkspaceRegistryState = {
  sessions: [
    {
      key: "platform",
      label: "Platform",
      windows: [
        { id: "w1", title: "claude", driver: "claude" },
        { id: "w2", title: "codex", driver: "codex" },
      ],
      activeWindowId: "w2",
    },
  ],
  activeSessionKey: "platform",
};

describe("workspace registry persistence", () => {
  it("returns null when storage is absent or empty", () => {
    expect(loadPersistedWorkspace(undefined)).toBeNull();
    expect(loadPersistedWorkspace(memoryStorage())).toBeNull();
  });

  it("round-trips a saved workspace state", () => {
    const storage = memoryStorage();
    savePersistedWorkspace(storage, seeded);
    expect(loadPersistedWorkspace(storage)).toEqual(seeded);
  });

  it("drops malformed sessions and windows on load", () => {
    const storage = memoryStorage();
    storage.setItem(
      "cockpit.workspace.v1",
      JSON.stringify({
        sessions: [
          { key: "platform", label: "Platform", windows: "nope" },
          { key: 42, label: "bad-key", windows: [] },
          {
            key: "infra",
            label: "Infra",
            windows: [
              { id: "w1", title: "claude", driver: "claude" },
              { id: "w2", title: "broken" },
            ],
            activeWindowId: "w1",
          },
        ],
        activeSessionKey: "infra",
      }),
    );
    const loaded = loadPersistedWorkspace(storage);
    expect(loaded?.sessions.map((s) => s.key)).toEqual(["infra"]);
    expect(loaded?.sessions[0]?.windows.map((w) => w.id)).toEqual(["w1"]);
    expect(loaded?.activeSessionKey).toBe("infra");
  });
});
