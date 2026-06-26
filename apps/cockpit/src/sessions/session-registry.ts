export interface CockpitSession {
  readonly key: string;
  readonly label: string;
}

export interface SessionRegistryState {
  readonly sessions: readonly CockpitSession[];
  readonly activeKey: string | null;
}

export const emptySessionRegistry: SessionRegistryState = {
  sessions: [],
  activeKey: null,
};

export type SessionRegistryEvent =
  | { readonly type: "registered"; readonly session: CockpitSession }
  | { readonly type: "selected"; readonly key: string }
  | { readonly type: "renamed"; readonly key: string; readonly label: string }
  | { readonly type: "removed"; readonly key: string };

export function reduceSessionRegistry(
  state: SessionRegistryState,
  event: SessionRegistryEvent,
): SessionRegistryState {
  switch (event.type) {
    case "registered":
      return registerSession(state, event.session);
    case "selected":
      return selectSession(state, event.key);
    case "renamed":
      return renameSession(state, event.key, event.label);
    case "removed":
      return removeSession(state, event.key);
  }
}

function registerSession(
  state: SessionRegistryState,
  session: CockpitSession,
): SessionRegistryState {
  if (hasSession(state, session.key)) {
    return state;
  }
  return {
    sessions: [...state.sessions, session],
    activeKey: state.activeKey ?? session.key,
  };
}

function selectSession(
  state: SessionRegistryState,
  key: string,
): SessionRegistryState {
  if (!hasSession(state, key) || state.activeKey === key) {
    return state;
  }
  return { ...state, activeKey: key };
}

function renameSession(
  state: SessionRegistryState,
  key: string,
  label: string,
): SessionRegistryState {
  if (!hasSession(state, key)) {
    return state;
  }
  return {
    ...state,
    sessions: state.sessions.map((session) =>
      session.key === key ? { ...session, label } : session,
    ),
  };
}

function removeSession(
  state: SessionRegistryState,
  key: string,
): SessionRegistryState {
  if (!hasSession(state, key)) {
    return state;
  }
  const sessions = state.sessions.filter((session) => session.key !== key);
  const activeKey =
    state.activeKey === key ? (sessions[0]?.key ?? null) : state.activeKey;
  return { sessions, activeKey };
}

function hasSession(state: SessionRegistryState, key: string): boolean {
  return state.sessions.some((session) => session.key === key);
}
