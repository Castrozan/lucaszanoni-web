import { useEffect, useRef } from "react";
import { useKeybindRegistry } from "@platform/design-system";
import { sessionJumpChordBytes } from "@platform/workspace";
import { useCockpitWorkspace } from "./cockpit-workspace-context";

export function useAttachedSessionChord(): void {
  const cockpitWorkspace = useCockpitWorkspace();
  const registry = useKeybindRegistry();
  const state = cockpitWorkspace?.controller.state;
  const activeSessionKey = state?.activeSessionKey ?? null;
  const oneBasedSessionNumber =
    state && activeSessionKey
      ? state.sessions.findIndex(
          (session) => session.key === activeSessionKey,
        ) + 1
      : 0;
  const sendKeystrokes =
    cockpitWorkspace?.attachedTerminalKeystrokeSender ?? null;
  const leaderBinding = registry?.leader ?? null;
  const steeredSessionKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!sendKeystrokes || !activeSessionKey || !leaderBinding) {
      return;
    }
    if (steeredSessionKeyRef.current === activeSessionKey) {
      return;
    }
    const chordBytes = sessionJumpChordBytes(
      leaderBinding,
      oneBasedSessionNumber,
    );
    if (!chordBytes) {
      return;
    }
    steeredSessionKeyRef.current = activeSessionKey;
    sendKeystrokes(chordBytes);
  }, [sendKeystrokes, activeSessionKey, oneBasedSessionNumber, leaderBinding]);
}
