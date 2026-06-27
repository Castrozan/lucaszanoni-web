import type {
  CockpitAgentDriverKind,
  CockpitWorkspaceSession,
  CockpitWorkspaceWindow,
  WorkspaceRegistryState,
} from "./workspace-registry";

const PERSISTED_WORKSPACE_KEY = "cockpit.workspace.v1";

interface PersistedWorkspace {
  sessions: unknown;
  activeSessionKey: unknown;
}

interface PersistableSession {
  key: string;
  label: string;
  windows: unknown[];
  activeWindowId: unknown;
}

export function loadPersistedWorkspace(
  storage: Storage | undefined,
): WorkspaceRegistryState | null {
  if (!storage) {
    return null;
  }
  const raw = storage.getItem(PERSISTED_WORKSPACE_KEY);
  if (!raw) {
    return null;
  }
  let parsed: PersistedWorkspace;
  try {
    parsed = JSON.parse(raw) as PersistedWorkspace;
  } catch {
    return null;
  }
  if (!parsed || !Array.isArray(parsed.sessions)) {
    return null;
  }
  const sessions = parsed.sessions
    .filter(isPersistableSession)
    .map(normalizePersistedSession);
  const activeSessionKey =
    typeof parsed.activeSessionKey === "string" &&
    sessions.some((session) => session.key === parsed.activeSessionKey)
      ? parsed.activeSessionKey
      : (sessions[0]?.key ?? null);
  return { sessions, activeSessionKey };
}

export function savePersistedWorkspace(
  storage: Storage | undefined,
  state: WorkspaceRegistryState,
): void {
  if (!storage) {
    return;
  }
  const payload = {
    sessions: state.sessions.map((session) => ({
      key: session.key,
      label: session.label,
      windows: session.windows.map((window) => ({
        id: window.id,
        title: window.title,
        driver: window.driver,
      })),
      activeWindowId: session.activeWindowId,
    })),
    activeSessionKey: state.activeSessionKey,
  };
  storage.setItem(PERSISTED_WORKSPACE_KEY, JSON.stringify(payload));
}

function normalizePersistedSession(
  session: PersistableSession,
): CockpitWorkspaceSession {
  const windows = session.windows.filter(isWorkspaceWindow).map((window) => ({
    id: window.id,
    title: window.title,
    driver: window.driver,
  }));
  const activeWindowId =
    typeof session.activeWindowId === "string" &&
    windows.some((window) => window.id === session.activeWindowId)
      ? session.activeWindowId
      : (windows[0]?.id ?? null);
  return {
    key: session.key,
    label: session.label,
    windows,
    activeWindowId,
  };
}

function isPersistableSession(value: unknown): value is PersistableSession {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as PersistableSession).key === "string" &&
    typeof (value as PersistableSession).label === "string" &&
    Array.isArray((value as PersistableSession).windows)
  );
}

function isWorkspaceWindow(value: unknown): value is CockpitWorkspaceWindow {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as CockpitWorkspaceWindow).id === "string" &&
    typeof (value as CockpitWorkspaceWindow).title === "string" &&
    isAgentDriverKind((value as CockpitWorkspaceWindow).driver)
  );
}

function isAgentDriverKind(value: unknown): value is CockpitAgentDriverKind {
  return value === "claude" || value === "codex";
}
