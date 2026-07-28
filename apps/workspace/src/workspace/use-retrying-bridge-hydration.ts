import { useEffect } from "react";
import { bridgeRetryDelayMilliseconds } from "./bridge-retry-schedule";
import type { WorkspaceRegistryState } from "./workspace-registry";

export function useRetryingBridgeHydration(
  readLiveRegistry: () => Promise<WorkspaceRegistryState>,
  commitLiveRegistry: (liveRegistry: WorkspaceRegistryState) => void,
): void {
  useEffect(() => {
    let stopped = false;
    let consecutiveFailedAttempts = 0;
    let pendingRetry: ReturnType<typeof setTimeout> | null = null;

    const attemptHydration = async () => {
      try {
        const liveRegistry = await readLiveRegistry();
        if (!stopped) {
          commitLiveRegistry(liveRegistry);
        }
      } catch {
        if (stopped) {
          return;
        }
        consecutiveFailedAttempts += 1;
        pendingRetry = setTimeout(() => {
          pendingRetry = null;
          void attemptHydration();
        }, bridgeRetryDelayMilliseconds(consecutiveFailedAttempts));
      }
    };

    void attemptHydration();
    return () => {
      stopped = true;
      if (pendingRetry !== null) {
        clearTimeout(pendingRetry);
      }
    };
  }, [readLiveRegistry, commitLiveRegistry]);
}
