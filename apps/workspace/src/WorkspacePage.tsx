import { useState } from "react";
import { Button } from "@platform/design-system";
import {
  useWorkspace,
  type UseWorkspaceOptions,
} from "./workspace/use-workspace";
import { WorkspaceSessionSwitcher } from "./workspace/WorkspaceSessionSwitcher";
import { WorkspaceWindowPanel } from "./workspace/WorkspaceWindowPanel";
import { resolveCockpitAttachEndpoint } from "./workspace/cockpit-attach-endpoint";

export interface WorkspacePageProps extends UseWorkspaceOptions {
  readonly sessionTerminalMachineEndpoint?: string | null;
}

export function WorkspacePage({
  sessionTerminalMachineEndpoint = null,
  ...workspaceOptions
}: WorkspacePageProps) {
  const workspace = useWorkspace(workspaceOptions);
  const [draftDomain, setDraftDomain] = useState("");
  const activeSession = workspace.state.sessions.find(
    (session) => session.key === workspace.state.activeSessionKey,
  );
  const sessionTerminalEndpoint =
    sessionTerminalMachineEndpoint && activeSession
      ? resolveCockpitAttachEndpoint(
          sessionTerminalMachineEndpoint,
          activeSession.key,
        )
      : null;

  return (
    <div className="flex h-[calc(100vh-var(--app-status-bar-height,2rem))] flex-col gap-4 p-4">
      <header className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="font-mono text-[11px] uppercase tracking-[2px] text-text-faint">
            WORKSPACE
          </span>
          <h1 className="m-0 font-grotesk text-2xl font-bold tracking-[-0.5px]">
            Agent terminal
          </h1>
        </div>
        <form
          className="flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const label = draftDomain.trim();
            if (!label) {
              return;
            }
            setDraftDomain("");
            void workspace.openSession(label);
          }}
        >
          <input
            aria-label="New work domain"
            value={draftDomain}
            onChange={(event) => setDraftDomain(event.target.value)}
            placeholder="Work domain…"
            className="rounded-md border border-border bg-surface px-3 py-1.5 font-mono text-sm text-foreground outline-none placeholder:text-text-faint"
          />
          <Button type="submit" size="sm">
            Open domain
          </Button>
        </form>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-background">
        <WorkspaceSessionSwitcher
          sessions={workspace.state.sessions}
          activeKey={workspace.state.activeSessionKey}
          onSelect={workspace.selectSession}
          onClose={workspace.closeSession}
        />
        {activeSession ? (
          <WorkspaceWindowPanel
            windows={activeSession.windows}
            activeWindowId={activeSession.activeWindowId}
            onOpenAgent={workspace.openWindow}
            onSelectWindow={workspace.selectWindow}
            onCloseWindow={workspace.closeWindow}
            sessionTerminalEndpoint={sessionTerminalEndpoint}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center font-mono text-xs uppercase tracking-[2px] text-text-faint">
            No work domains yet · open one to start
          </div>
        )}
      </div>
    </div>
  );
}
