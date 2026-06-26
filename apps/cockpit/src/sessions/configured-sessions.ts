import type { CockpitSession } from "./session-registry";

export function parseConfiguredSessions(raw: string): CockpitSession[] {
  const sessions: CockpitSession[] = [];
  const seenKeys = new Set<string>();
  for (const entry of raw.split(",")) {
    const trimmedEntry = entry.trim();
    if (trimmedEntry.length === 0) {
      continue;
    }
    const separatorIndex = trimmedEntry.indexOf(":");
    const key =
      separatorIndex === -1
        ? trimmedEntry
        : trimmedEntry.slice(0, separatorIndex).trim();
    if (key.length === 0 || seenKeys.has(key)) {
      continue;
    }
    const label =
      separatorIndex === -1
        ? key
        : trimmedEntry.slice(separatorIndex + 1).trim() || key;
    seenKeys.add(key);
    sessions.push({ key, label });
  }
  return sessions;
}

export function readConfiguredSessions(): CockpitSession[] {
  return parseConfiguredSessions(import.meta.env.VITE_COCKPIT_SESSIONS ?? "");
}
