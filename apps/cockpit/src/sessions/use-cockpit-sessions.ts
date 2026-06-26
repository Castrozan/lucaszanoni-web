import { useCallback, useEffect, useReducer } from "react";
import {
  emptySessionRegistry,
  reduceSessionRegistry,
  type CockpitSession,
  type SessionRegistryState,
} from "./session-registry";
import { readConfiguredSessions } from "./configured-sessions";
import {
  loadPersistedRegistry,
  savePersistedRegistry,
} from "./session-registry-persistence";

function browserLocalStorage(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

function mergeConfiguredSessions(
  base: SessionRegistryState,
  configured: readonly CockpitSession[],
): SessionRegistryState {
  return configured.reduce(
    (state, session) =>
      reduceSessionRegistry(state, { type: "registered", session }),
    base,
  );
}

interface CockpitSessionsInit {
  initialSessions?: readonly CockpitSession[];
  storage?: Storage;
}

function initializeRegistry({
  initialSessions,
  storage,
}: CockpitSessionsInit): SessionRegistryState {
  const persisted = loadPersistedRegistry(storage);
  const configured = initialSessions ?? readConfiguredSessions();
  return mergeConfiguredSessions(persisted ?? emptySessionRegistry, configured);
}

export interface CockpitSessionsController {
  sessions: readonly CockpitSession[];
  activeKey: string | null;
  selectSession: (key: string) => void;
  renameSession: (key: string, label: string) => void;
}

export function useCockpitSessions(
  initialSessions?: readonly CockpitSession[],
  storage: Storage | undefined = browserLocalStorage(),
): CockpitSessionsController {
  const [state, dispatch] = useReducer(
    reduceSessionRegistry,
    { initialSessions, storage },
    initializeRegistry,
  );

  useEffect(() => {
    savePersistedRegistry(storage, state);
  }, [storage, state]);

  const selectSession = useCallback(
    (key: string) => dispatch({ type: "selected", key }),
    [],
  );

  const renameSession = useCallback(
    (key: string, label: string) => dispatch({ type: "renamed", key, label }),
    [],
  );

  return {
    sessions: state.sessions,
    activeKey: state.activeKey,
    selectSession,
    renameSession,
  };
}
