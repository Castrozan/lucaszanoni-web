import { describe, expect, it } from "vitest";
import {
  loadPersistedRegistry,
  savePersistedRegistry,
} from "../src/sessions/session-registry-persistence";

function createFakeStorage(seed: Record<string, string> = {}): Storage {
  const entries = new Map<string, string>(Object.entries(seed));
  return {
    get length() {
      return entries.size;
    },
    clear: () => entries.clear(),
    getItem: (key) => entries.get(key) ?? null,
    key: (index) => Array.from(entries.keys())[index] ?? null,
    removeItem: (key) => entries.delete(key),
    setItem: (key, value) => entries.set(key, value),
  };
}

describe("session registry persistence", () => {
  it("returns null when no storage is available", () => {
    expect(loadPersistedRegistry(undefined)).toBeNull();
  });

  it("returns null when nothing has been persisted", () => {
    expect(loadPersistedRegistry(createFakeStorage())).toBeNull();
  });

  it("returns null when the stored payload is malformed", () => {
    const storage = createFakeStorage({ "cockpit.sessions.v1": "not json" });
    expect(loadPersistedRegistry(storage)).toBeNull();
  });

  it("round-trips a saved registry", () => {
    const storage = createFakeStorage();
    savePersistedRegistry(storage, {
      sessions: [
        { key: "global", label: "Jarvis" },
        { key: "build", label: "Build" },
      ],
      activeKey: "build",
    });
    expect(loadPersistedRegistry(storage)).toEqual({
      sessions: [
        { key: "global", label: "Jarvis" },
        { key: "build", label: "Build" },
      ],
      activeKey: "build",
    });
  });

  it("drops malformed session entries and repairs a dangling active key", () => {
    const storage = createFakeStorage({
      "cockpit.sessions.v1": JSON.stringify({
        sessions: [{ key: "global", label: "Jarvis" }, { key: 7 }, null],
        activeKey: "ghost",
      }),
    });
    expect(loadPersistedRegistry(storage)).toEqual({
      sessions: [{ key: "global", label: "Jarvis" }],
      activeKey: "global",
    });
  });
});
