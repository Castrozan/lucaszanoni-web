import { useEffect } from "react";
import { bridgeRetryDelayMilliseconds } from "./bridge-retry-schedule";
import type { WorkspaceRegistryState } from "./workspace-registry";

export const BRIDGE_REFRESH_INTERVAL_MILLISECONDS = 5000;

export function useLiveBridgeRegistry(
  readLiveRegistry: () => Promise<WorkspaceRegistryState>,
  commitLiveRegistry: (liveRegistry: WorkspaceRegistryState) => void,
): void {
  useEffect(() => {
    let stopped = false;
    let consecutiveFailedAttempts = 0;
    let pendingAttempt: ReturnType<typeof setTimeout> | null = null;

    const attemptRead = async () => {
      let delayBeforeNextAttempt = BRIDGE_REFRESH_INTERVAL_MILLISECONDS;
      try {
        const liveRegistry = await readLiveRegistry();
        if (stopped) {
          return;
        }
        consecutiveFailedAttempts = 0;
        commitLiveRegistry(liveRegistry);
      } catch {
        if (stopped) {
          return;
        }
        consecutiveFailedAttempts += 1;
        delayBeforeNextAttempt = bridgeRetryDelayMilliseconds(
          consecutiveFailedAttempts,
        );
      }
      pendingAttempt = setTimeout(() => {
        pendingAttempt = null;
        void attemptRead();
      }, delayBeforeNextAttempt);
    };

    void attemptRead();
    return () => {
      stopped = true;
      if (pendingAttempt !== null) {
        clearTimeout(pendingAttempt);
      }
    };
  }, [readLiveRegistry, commitLiveRegistry]);
}
