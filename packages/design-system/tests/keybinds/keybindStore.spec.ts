import { describe, expect, it } from "vitest";
import {
  DEFAULT_LEADER_BINDING,
  type KeybindPreferenceStorage,
  loadKeybindOverrides,
  loadLeaderBinding,
  saveKeybindOverride,
  saveLeaderBinding,
} from "../../src/keybinds/keybindStore";

function memoryStorage(): KeybindPreferenceStorage {
  const map = new Map<string, string>();
  return {
    getItem: (key) => (map.has(key) ? (map.get(key) as string) : null),
    setItem: (key, value) => {
      map.set(key, value);
    },
  };
}

describe("keybindStore", () => {
  it("round-trips user overrides", () => {
    const storage = memoryStorage();
    expect(loadKeybindOverrides(storage)).toEqual({});
    saveKeybindOverride(storage, "command-palette.open", "Mod+p");
    expect(loadKeybindOverrides(storage)).toEqual({
      "command-palette.open": "Mod+p",
    });
  });

  it("ignores malformed override json", () => {
    const storage = memoryStorage();
    storage.setItem("atrium.keybinds.overrides", "{not json");
    expect(loadKeybindOverrides(storage)).toEqual({});
  });

  it("defaults the leader binding and round-trips an override", () => {
    const storage = memoryStorage();
    expect(loadLeaderBinding(storage)).toBe(DEFAULT_LEADER_BINDING);
    saveLeaderBinding(storage, "Control+a");
    expect(loadLeaderBinding(storage)).toBe("Control+a");
  });
});
