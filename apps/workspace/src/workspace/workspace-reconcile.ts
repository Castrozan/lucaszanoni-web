import type {
  CockpitWorkspaceSession,
  WorkspaceRegistryState,
} from "./workspace-registry";

export function reconcileWorkspace(
  persisted: WorkspaceRegistryState,
  live: readonly CockpitWorkspaceSession[],
): WorkspaceRegistryState {
  const sessions = live.map((liveSession) => {
    const persistedSession = persisted.sessions.find(
      (session) => session.key === liveSession.key,
    );
    return reconcileSession(liveSession, persistedSession);
  });
  const activeSessionKey = sessions.some(
    (session) => session.key === persisted.activeSessionKey,
  )
    ? persisted.activeSessionKey
    : (sessions[0]?.key ?? null);
  return { sessions, activeSessionKey };
}

function reconcileSession(
  liveSession: CockpitWorkspaceSession,
  persistedSession: CockpitWorkspaceSession | undefined,
): CockpitWorkspaceSession {
  const persistedActiveWindowId = persistedSession?.activeWindowId;
  const activeWindowId =
    typeof persistedActiveWindowId === "string" &&
    liveSession.windows.some((window) => window.id === persistedActiveWindowId)
      ? persistedActiveWindowId
      : liveSession.activeWindowId;
  return { ...liveSession, activeWindowId };
}
