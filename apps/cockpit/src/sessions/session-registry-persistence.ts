import type { CockpitSession, SessionRegistryState } from "./session-registry";

const PERSISTED_REGISTRY_KEY = "cockpit.sessions.v1";

interface PersistedRegistry {
  sessions: unknown;
  activeKey: unknown;
}

export function loadPersistedRegistry(
  storage: Storage | undefined,
): SessionRegistryState | null {
  if (!storage) {
    return null;
  }
  const raw = storage.getItem(PERSISTED_REGISTRY_KEY);
  if (!raw) {
    return null;
  }
  let parsed: PersistedRegistry;
  try {
    parsed = JSON.parse(raw) as PersistedRegistry;
  } catch {
    return null;
  }
  if (!parsed || !Array.isArray(parsed.sessions)) {
    return null;
  }
  const sessions = parsed.sessions.filter(isCockpitSession);
  const activeKey =
    typeof parsed.activeKey === "string" &&
    sessions.some((session) => session.key === parsed.activeKey)
      ? parsed.activeKey
      : (sessions[0]?.key ?? null);
  return { sessions, activeKey };
}

export function savePersistedRegistry(
  storage: Storage | undefined,
  state: SessionRegistryState,
): void {
  if (!storage) {
    return;
  }
  const payload = {
    sessions: state.sessions.map((session) => ({
      key: session.key,
      label: session.label,
    })),
    activeKey: state.activeKey,
  };
  storage.setItem(PERSISTED_REGISTRY_KEY, JSON.stringify(payload));
}

function isCockpitSession(value: unknown): value is CockpitSession {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as CockpitSession).key === "string" &&
    typeof (value as CockpitSession).label === "string"
  );
}
