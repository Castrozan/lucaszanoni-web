import { useCallback, useReducer } from "react";
import {
  emptySessionRegistry,
  reduceSessionRegistry,
  type CockpitSession,
  type SessionRegistryState,
} from "./session-registry";
import { readConfiguredSessions } from "./configured-sessions";

function seedRegistry(
  initialSessions: readonly CockpitSession[],
): SessionRegistryState {
  return initialSessions.reduce(
    (state, session) =>
      reduceSessionRegistry(state, { type: "registered", session }),
    emptySessionRegistry,
  );
}

export interface CockpitSessionsController {
  sessions: readonly CockpitSession[];
  activeKey: string | null;
  selectSession: (key: string) => void;
}

export function useCockpitSessions(
  initialSessions?: readonly CockpitSession[],
): CockpitSessionsController {
  const [state, dispatch] = useReducer(
    reduceSessionRegistry,
    initialSessions,
    (seed) => seedRegistry(seed ?? readConfiguredSessions()),
  );

  const selectSession = useCallback(
    (key: string) => dispatch({ type: "selected", key }),
    [],
  );

  return {
    sessions: state.sessions,
    activeKey: state.activeKey,
    selectSession,
  };
}
