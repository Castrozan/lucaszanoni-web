import type { CockpitSession } from "./session-registry";

export const DEFAULT_COCKPIT_SESSIONS: readonly CockpitSession[] = [
  { key: "main", label: "Main" },
  { key: "build", label: "Build" },
  { key: "deploy", label: "Deploy" },
];

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

export function resolveConfiguredSessions(raw: string): CockpitSession[] {
  const configured = parseConfiguredSessions(raw);
  return configured.length > 0 ? configured : [...DEFAULT_COCKPIT_SESSIONS];
}

export function readConfiguredSessions(): CockpitSession[] {
  return resolveConfiguredSessions(import.meta.env.VITE_COCKPIT_SESSIONS ?? "");
}
