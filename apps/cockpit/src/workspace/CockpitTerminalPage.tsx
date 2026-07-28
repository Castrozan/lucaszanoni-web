import {
  resolveCockpitAttachEndpoint,
  SessionTerminal,
} from "@platform/workspace";
import { useCockpitWorkspace } from "./cockpit-workspace-context";
import { useAttachedSessionChord } from "./use-attached-session-chord";

export function CockpitTerminalPage() {
  const cockpitWorkspace = useCockpitWorkspace();
  useAttachedSessionChord();
  if (!cockpitWorkspace) {
    return null;
  }
  const {
    controller,
    sessionTerminalMachineEndpoint,
    publishAttachedTerminalKeystrokeSender,
  } = cockpitWorkspace;
  const activeSession = controller.state.sessions.find(
    (session) => session.key === controller.state.activeSessionKey,
  );
  const attachEndpoint =
    sessionTerminalMachineEndpoint && activeSession
      ? resolveCockpitAttachEndpoint(
          sessionTerminalMachineEndpoint,
          activeSession.key,
        )
      : null;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      {attachEndpoint && activeSession ? (
        <SessionTerminal
          key={activeSession.key}
          endpoint={attachEndpoint}
          publishOwnerKeystrokeSender={publishAttachedTerminalKeystrokeSender}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center font-mono text-xs uppercase tracking-[2px] text-text-faint">
          No session · leader then shift+s to create one
        </div>
      )}
    </div>
  );
}
