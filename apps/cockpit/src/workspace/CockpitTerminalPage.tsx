import {
  resolveCockpitAttachEndpoint,
  SessionTerminal,
} from "@platform/workspace";
import { useCockpitWorkspace } from "./cockpit-workspace-context";

export function CockpitTerminalPage() {
  const cockpitWorkspace = useCockpitWorkspace();
  if (!cockpitWorkspace) {
    return null;
  }
  const { controller, sessionTerminalMachineEndpoint } = cockpitWorkspace;
  const activeSession = controller.state.sessions.find(
    (session) => session.key === controller.state.activeSessionKey,
  );
  const activeWindow = activeSession?.windows.find(
    (window) => window.id === activeSession.activeWindowId,
  );
  const attachEndpoint =
    sessionTerminalMachineEndpoint && activeWindow?.terminalIdentifier
      ? resolveCockpitAttachEndpoint(
          sessionTerminalMachineEndpoint,
          activeWindow.terminalIdentifier,
        )
      : null;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      {attachEndpoint && activeWindow ? (
        <SessionTerminal key={activeWindow.id} endpoint={attachEndpoint} />
      ) : (
        <div className="flex flex-1 items-center justify-center font-mono text-xs uppercase tracking-[2px] text-text-faint">
          No window · leader then shift+s to create a session
        </div>
      )}
    </div>
  );
}
