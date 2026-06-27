export type CockpitAgentDriverKind = "claude" | "codex";

export interface CockpitWorkspaceWindow {
  readonly id: string;
  readonly title: string;
  readonly driver: CockpitAgentDriverKind;
}

export interface CockpitWorkspaceSession {
  readonly key: string;
  readonly label: string;
  readonly windows: readonly CockpitWorkspaceWindow[];
  readonly activeWindowId: string | null;
}

export interface WorkspaceRegistryState {
  readonly sessions: readonly CockpitWorkspaceSession[];
  readonly activeSessionKey: string | null;
}

export const emptyWorkspaceRegistry: WorkspaceRegistryState = {
  sessions: [],
  activeSessionKey: null,
};

export type WorkspaceRegistryEvent =
  | {
      readonly type: "sessionOpened";
      readonly session: { readonly key: string; readonly label: string };
    }
  | { readonly type: "sessionSelected"; readonly key: string }
  | {
      readonly type: "sessionRenamed";
      readonly key: string;
      readonly label: string;
    }
  | { readonly type: "sessionClosed"; readonly key: string }
  | {
      readonly type: "windowOpened";
      readonly sessionKey: string;
      readonly window: CockpitWorkspaceWindow;
    }
  | {
      readonly type: "windowSelected";
      readonly sessionKey: string;
      readonly windowId: string;
    }
  | {
      readonly type: "windowClosed";
      readonly sessionKey: string;
      readonly windowId: string;
    };

export function reduceWorkspaceRegistry(
  state: WorkspaceRegistryState,
  event: WorkspaceRegistryEvent,
): WorkspaceRegistryState {
  switch (event.type) {
    case "sessionOpened":
      return openSession(state, event.session.key, event.session.label);
    case "sessionSelected":
      return selectSession(state, event.key);
    case "sessionRenamed":
      return renameSession(state, event.key, event.label);
    case "sessionClosed":
      return closeSession(state, event.key);
    case "windowOpened":
      return mapSession(state, event.sessionKey, (session) =>
        openWindow(session, event.window),
      );
    case "windowSelected":
      return mapSession(state, event.sessionKey, (session) =>
        selectWindow(session, event.windowId),
      );
    case "windowClosed":
      return mapSession(state, event.sessionKey, (session) =>
        closeWindow(session, event.windowId),
      );
  }
}

function openSession(
  state: WorkspaceRegistryState,
  key: string,
  label: string,
): WorkspaceRegistryState {
  if (hasSession(state, key)) {
    return state;
  }
  const session: CockpitWorkspaceSession = {
    key,
    label,
    windows: [],
    activeWindowId: null,
  };
  return {
    sessions: [...state.sessions, session],
    activeSessionKey: state.activeSessionKey ?? key,
  };
}

function selectSession(
  state: WorkspaceRegistryState,
  key: string,
): WorkspaceRegistryState {
  if (!hasSession(state, key) || state.activeSessionKey === key) {
    return state;
  }
  return { ...state, activeSessionKey: key };
}

function renameSession(
  state: WorkspaceRegistryState,
  key: string,
  label: string,
): WorkspaceRegistryState {
  return mapSession(state, key, (session) => ({ ...session, label }));
}

function closeSession(
  state: WorkspaceRegistryState,
  key: string,
): WorkspaceRegistryState {
  if (!hasSession(state, key)) {
    return state;
  }
  const sessions = state.sessions.filter((session) => session.key !== key);
  const activeSessionKey =
    state.activeSessionKey === key
      ? (sessions[0]?.key ?? null)
      : state.activeSessionKey;
  return { sessions, activeSessionKey };
}

function openWindow(
  session: CockpitWorkspaceSession,
  window: CockpitWorkspaceWindow,
): CockpitWorkspaceSession {
  if (session.windows.some((existing) => existing.id === window.id)) {
    return session;
  }
  return {
    ...session,
    windows: [...session.windows, window],
    activeWindowId: session.activeWindowId ?? window.id,
  };
}

function selectWindow(
  session: CockpitWorkspaceSession,
  windowId: string,
): CockpitWorkspaceSession {
  if (
    !session.windows.some((window) => window.id === windowId) ||
    session.activeWindowId === windowId
  ) {
    return session;
  }
  return { ...session, activeWindowId: windowId };
}

function closeWindow(
  session: CockpitWorkspaceSession,
  windowId: string,
): CockpitWorkspaceSession {
  if (!session.windows.some((window) => window.id === windowId)) {
    return session;
  }
  const windows = session.windows.filter((window) => window.id !== windowId);
  const activeWindowId =
    session.activeWindowId === windowId
      ? (windows[0]?.id ?? null)
      : session.activeWindowId;
  return { ...session, windows, activeWindowId };
}

function mapSession(
  state: WorkspaceRegistryState,
  key: string,
  transform: (session: CockpitWorkspaceSession) => CockpitWorkspaceSession,
): WorkspaceRegistryState {
  if (!hasSession(state, key)) {
    return state;
  }
  return {
    ...state,
    sessions: state.sessions.map((session) =>
      session.key === key ? transform(session) : session,
    ),
  };
}

function hasSession(state: WorkspaceRegistryState, key: string): boolean {
  return state.sessions.some((session) => session.key === key);
}
