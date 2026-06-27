import {
  emptyWorkspaceRegistry,
  reduceWorkspaceRegistry,
  type CockpitWorkspaceSession,
  type CockpitWorkspaceWindow,
  type WorkspaceRegistryState,
} from "./workspace-registry";
import type { CockpitComputePort, ComputeWindowSpec } from "./compute-port";

export interface InMemoryComputeAdapterOptions {
  readonly createSessionKey?: (label: string, sequence: number) => string;
  readonly createWindowId?: (sequence: number) => string;
  readonly initialState?: WorkspaceRegistryState;
}

export function createInMemoryComputeAdapter(
  options: InMemoryComputeAdapterOptions = {},
): CockpitComputePort {
  const createSessionKey = options.createSessionKey ?? defaultSessionKey;
  const createWindowId = options.createWindowId ?? defaultWindowId;
  let state: WorkspaceRegistryState =
    options.initialState ?? emptyWorkspaceRegistry;
  let sessionSequence = highestTrailingSequence(
    state.sessions.map((session) => session.key),
  );
  let windowSequence = highestTrailingSequence(
    state.sessions.flatMap((session) =>
      session.windows.map((window) => window.id),
    ),
  );

  function findSession(key: string): CockpitWorkspaceSession | undefined {
    return state.sessions.find((session) => session.key === key);
  }

  return {
    async listSessions() {
      return state.sessions;
    },
    async openSession(label) {
      sessionSequence += 1;
      const key = createSessionKey(label, sessionSequence);
      state = reduceWorkspaceRegistry(state, {
        type: "sessionOpened",
        session: { key, label },
      });
      const opened = findSession(key);
      if (!opened) {
        throw new Error(`compute adapter failed to open session ${key}`);
      }
      return opened;
    },
    async renameSession(key, label) {
      state = reduceWorkspaceRegistry(state, {
        type: "sessionRenamed",
        key,
        label,
      });
    },
    async closeSession(key) {
      state = reduceWorkspaceRegistry(state, { type: "sessionClosed", key });
    },
    async openWindow(sessionKey, spec: ComputeWindowSpec) {
      windowSequence += 1;
      const window: CockpitWorkspaceWindow = {
        id: createWindowId(windowSequence),
        title: spec.title,
        driver: spec.driver,
      };
      state = reduceWorkspaceRegistry(state, {
        type: "windowOpened",
        sessionKey,
        window,
      });
      return window;
    },
    async closeWindow(sessionKey, windowId) {
      state = reduceWorkspaceRegistry(state, {
        type: "windowClosed",
        sessionKey,
        windowId,
      });
    },
    dispose() {},
  };
}

function highestTrailingSequence(values: readonly string[]): number {
  return values.reduce((highest, value) => {
    const trailingDigits = /-(\d+)$/.exec(value)?.[1];
    if (trailingDigits === undefined) {
      return highest;
    }
    const parsed = Number.parseInt(trailingDigits, 10);
    return parsed > highest ? parsed : highest;
  }, 0);
}

function defaultSessionKey(_label: string, sequence: number): string {
  return `session-${sequence}`;
}

function defaultWindowId(sequence: number): string {
  return `window-${sequence}`;
}
