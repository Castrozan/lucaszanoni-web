import { useState } from "react";
import { Button } from "@platform/design-system";
import type {
  CockpitAgentDriverKind,
  CockpitWorkspaceWindow,
} from "./workspace-registry";
import {
  cockpitAgentDrivers,
  defaultCockpitAgentDriverKind,
  resolveAgentDriver,
} from "./agent-driver";
import { SessionTerminal } from "./SessionTerminal";

export interface WorkspaceWindowPanelProps {
  windows: readonly CockpitWorkspaceWindow[];
  activeWindowId: string | null;
  onOpenAgent: (driver: CockpitAgentDriverKind) => void;
  onSelectWindow: (windowId: string) => void;
  onCloseWindow: (windowId: string) => void;
  sessionTerminalEndpoint?: string | null;
}

export function WorkspaceWindowPanel({
  windows,
  activeWindowId,
  onOpenAgent,
  onSelectWindow,
  onCloseWindow,
  sessionTerminalEndpoint = null,
}: WorkspaceWindowPanelProps) {
  const [driver, setDriver] = useState<CockpitAgentDriverKind>(
    defaultCockpitAgentDriverKind,
  );
  return (
    <section
      aria-label="Agents"
      className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-4"
    >
      <div className="flex items-center gap-2">
        <label className="font-mono text-[11px] uppercase tracking-[2px] text-text-faint">
          Agent
          <select
            aria-label="Agent driver"
            value={driver}
            onChange={(event) =>
              setDriver(event.target.value as CockpitAgentDriverKind)
            }
            className="ml-2 rounded-md border border-border bg-surface px-2 py-1 font-mono text-sm text-foreground"
          >
            {cockpitAgentDrivers.map((option) => (
              <option key={option.kind} value={option.kind}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <Button
          type="button"
          size="sm"
          variant="default"
          onClick={() => onOpenAgent(driver)}
        >
          Open agent
        </Button>
      </div>
      {windows.length === 0 ? (
        <p className="m-0 font-mono text-xs uppercase tracking-[2px] text-text-faint">
          No agents running in this domain
        </p>
      ) : (
        <ul
          aria-label="Agent windows"
          className="m-0 flex list-none flex-col gap-2 p-0"
        >
          {windows.map((window) => {
            const isActive = window.id === activeWindowId;
            return (
              <li
                key={window.id}
                className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2"
              >
                <Button
                  type="button"
                  size="sm"
                  variant={isActive ? "default" : "terminal"}
                  aria-current={isActive ? "true" : "false"}
                  onClick={() => onSelectWindow(window.id)}
                >
                  {resolveAgentDriver(window.driver).label}
                </Button>
                <span className="flex-1 font-mono text-sm text-muted-foreground">
                  {window.title}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label={`Close ${window.title}`}
                  onClick={() => onCloseWindow(window.id)}
                >
                  ×
                </Button>
              </li>
            );
          })}
        </ul>
      )}
      {sessionTerminalEndpoint ? (
        <SessionTerminal endpoint={sessionTerminalEndpoint} />
      ) : null}
    </section>
  );
}
