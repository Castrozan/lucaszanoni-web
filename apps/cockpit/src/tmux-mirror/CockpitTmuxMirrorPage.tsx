import {
  resolveCockpitAttachEndpoint,
  SessionTerminal,
} from "@platform/workspace";
import { useCockpitWorkspace } from "./cockpit-workspace-context";

export function CockpitTmuxMirrorPage() {
  const cockpitWorkspace = useCockpitWorkspace();
  if (!cockpitWorkspace) {
    return null;
  }
  const { controller, sessionTerminalMachineEndpoint } = cockpitWorkspace;
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
        <SessionTerminal key={activeSession.key} endpoint={attachEndpoint} />
      ) : (
        <div className="flex flex-1 items-center justify-center font-mono text-xs uppercase tracking-[2px] text-text-faint">
          No session · leader then shift+s to create one
        </div>
      )}
    </div>
  );
}
