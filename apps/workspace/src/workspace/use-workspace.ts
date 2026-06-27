import { useCallback, useMemo, useRef, useState } from "react";
import {
  emptyWorkspaceRegistry,
  reduceWorkspaceRegistry,
  type CockpitAgentDriverKind,
  type WorkspaceRegistryState,
} from "./workspace-registry";
import type { CockpitComputePort } from "./compute-port";
import { createInMemoryComputeAdapter } from "./in-memory-compute-adapter";
import {
  loadPersistedWorkspace,
  savePersistedWorkspace,
} from "./workspace-registry-persistence";
import { reconcileWorkspace } from "./workspace-reconcile";

export interface UseWorkspaceOptions {
  readonly storage?: Storage;
  readonly createCompute?: (seed: WorkspaceRegistryState) => CockpitComputePort;
}

export interface WorkspaceController {
  readonly state: WorkspaceRegistryState;
  openSession(label: string): Promise<void>;
  selectSession(key: string): void;
  closeSession(key: string): Promise<void>;
  openWindow(driver: CockpitAgentDriverKind): Promise<void>;
  selectWindow(windowId: string): void;
  closeWindow(windowId: string): Promise<void>;
}

export function useWorkspace(
  options: UseWorkspaceOptions = {},
): WorkspaceController {
  const { storage, createCompute } = options;
  const initialState = useMemo(
    () => loadPersistedWorkspace(storage) ?? emptyWorkspaceRegistry,
    [storage],
  );
  const computeRef = useRef<CockpitComputePort | null>(null);
  if (!computeRef.current) {
    computeRef.current = createCompute
      ? createCompute(initialState)
      : createInMemoryComputeAdapter({ initialState });
  }
  const compute = computeRef.current;
  const [state, setState] = useState<WorkspaceRegistryState>(initialState);
  const stateRef = useRef<WorkspaceRegistryState>(initialState);

  const commit = useCallback(
    (next: WorkspaceRegistryState) => {
      stateRef.current = next;
      savePersistedWorkspace(storage, next);
      setState(next);
    },
    [storage],
  );

  const syncExistence = useCallback(async () => {
    const live = await compute.listSessions();
    return reconcileWorkspace(stateRef.current, live);
  }, [compute]);

  const openSession = useCallback(
    async (label: string) => {
      const created = await compute.openSession(label);
      const reconciled = await syncExistence();
      commit(
        reduceWorkspaceRegistry(reconciled, {
          type: "sessionSelected",
          key: created.key,
        }),
      );
    },
    [commit, compute, syncExistence],
  );

  const selectSession = useCallback(
    (key: string) => {
      commit(
        reduceWorkspaceRegistry(stateRef.current, {
          type: "sessionSelected",
          key,
        }),
      );
    },
    [commit],
  );

  const closeSession = useCallback(
    async (key: string) => {
      await compute.closeSession(key);
      commit(await syncExistence());
    },
    [commit, compute, syncExistence],
  );

  const openWindow = useCallback(
    async (driver: CockpitAgentDriverKind) => {
      const sessionKey = stateRef.current.activeSessionKey;
      if (!sessionKey) {
        return;
      }
      const created = await compute.openWindow(sessionKey, {
        title: driver,
        driver,
      });
      const reconciled = await syncExistence();
      commit(
        reduceWorkspaceRegistry(reconciled, {
          type: "windowSelected",
          sessionKey,
          windowId: created.id,
        }),
      );
    },
    [commit, compute, syncExistence],
  );

  const selectWindow = useCallback(
    (windowId: string) => {
      const sessionKey = stateRef.current.activeSessionKey;
      if (!sessionKey) {
        return;
      }
      commit(
        reduceWorkspaceRegistry(stateRef.current, {
          type: "windowSelected",
          sessionKey,
          windowId,
        }),
      );
    },
    [commit],
  );

  const closeWindow = useCallback(
    async (windowId: string) => {
      const sessionKey = stateRef.current.activeSessionKey;
      if (!sessionKey) {
        return;
      }
      await compute.closeWindow(sessionKey, windowId);
      commit(await syncExistence());
    },
    [commit, compute, syncExistence],
  );

  return {
    state,
    openSession,
    selectSession,
    closeSession,
    openWindow,
    selectWindow,
    closeWindow,
  };
}
