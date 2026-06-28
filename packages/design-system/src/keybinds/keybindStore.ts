export const DEFAULT_LEADER_BINDING = "Control+b";

const OVERRIDES_STORAGE_KEY = "atrium.keybinds.overrides";
const LEADER_STORAGE_KEY = "atrium.keybinds.leader";

export interface KeybindPreferenceStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function loadKeybindOverrides(
  storage: KeybindPreferenceStorage,
): Record<string, string> {
  const raw = storage.getItem(OVERRIDES_STORAGE_KEY);
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, string>;
    }
    return {};
  } catch {
    return {};
  }
}

export function saveKeybindOverride(
  storage: KeybindPreferenceStorage,
  actionId: string,
  binding: string,
): Record<string, string> {
  const overrides = { ...loadKeybindOverrides(storage), [actionId]: binding };
  storage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
  return overrides;
}

export function removeKeybindOverride(
  storage: KeybindPreferenceStorage,
  actionId: string,
): Record<string, string> {
  const remaining = { ...loadKeybindOverrides(storage) };
  delete remaining[actionId];
  storage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(remaining));
  return remaining;
}

export function loadLeaderBinding(storage: KeybindPreferenceStorage): string {
  const raw = storage.getItem(LEADER_STORAGE_KEY);
  return raw && raw.trim().length > 0 ? raw : DEFAULT_LEADER_BINDING;
}

export function saveLeaderBinding(
  storage: KeybindPreferenceStorage,
  binding: string,
): void {
  storage.setItem(LEADER_STORAGE_KEY, binding);
}
