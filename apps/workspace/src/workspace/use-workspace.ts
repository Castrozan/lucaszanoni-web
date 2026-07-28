import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { useRetryingBridgeHydration } from "./use-retrying-bridge-hydration";

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
  const [state, setState] = useState<WorkspaceRegistryState>(initialState);
  const stateRef = useRef<WorkspaceRegistryState>(initialState);
  const storageRef = useRef<Storage | undefined>(storage);
  storageRef.current = storage;
  const computeRef = useRef<CockpitComputePort | null>(null);
  const createComputeRef = useRef(createCompute);
  createComputeRef.current = createCompute;

  const resolveCompute = useCallback((): CockpitComputePort => {
    if (!computeRef.current) {
      const createComputeForThisWorkspace = createComputeRef.current;
      computeRef.current = createComputeForThisWorkspace
        ? createComputeForThisWorkspace(stateRef.current)
        : createInMemoryComputeAdapter({ initialState: stateRef.current });
    }
    return computeRef.current;
  }, []);

  useEffect(
    () => () => {
      computeRef.current?.dispose();
      computeRef.current = null;
    },
    [],
  );

  const commit = useCallback((next: WorkspaceRegistryState) => {
    stateRef.current = next;
    savePersistedWorkspace(storageRef.current, next);
    setState(next);
  }, []);

  const syncExistence = useCallback(async () => {
    const live = await resolveCompute().listSessions();
    return reconcileWorkspace(stateRef.current, live);
  }, [resolveCompute]);

  useRetryingBridgeHydration(syncExistence, commit);

  const openSession = useCallback(
    async (label: string) => {
      const created = await resolveCompute().openSession(label);
      const reconciled = await syncExistence();
      commit(
        reduceWorkspaceRegistry(reconciled, {
          type: "sessionSelected",
          key: created.key,
        }),
      );
    },
    [commit, resolveCompute, syncExistence],
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
      await resolveCompute().closeSession(key);
      commit(await syncExistence());
    },
    [commit, resolveCompute, syncExistence],
  );

  const openWindow = useCallback(
    async (driver: CockpitAgentDriverKind) => {
      const sessionKey = stateRef.current.activeSessionKey;
      if (!sessionKey) {
        return;
      }
      const created = await resolveCompute().openWindow(sessionKey, {
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
    [commit, resolveCompute, syncExistence],
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
      await resolveCompute().closeWindow(sessionKey, windowId);
      commit(await syncExistence());
    },
    [commit, resolveCompute, syncExistence],
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
