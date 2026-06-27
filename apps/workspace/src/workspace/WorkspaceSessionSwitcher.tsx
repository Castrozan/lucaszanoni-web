import { Button } from "@platform/design-system";
import type { CockpitWorkspaceSession } from "./workspace-registry";

export interface WorkspaceSessionSwitcherProps {
  sessions: readonly CockpitWorkspaceSession[];
  activeKey: string | null;
  onSelect: (key: string) => void;
  onClose: (key: string) => void;
}

export function WorkspaceSessionSwitcher({
  sessions,
  activeKey,
  onSelect,
  onClose,
}: WorkspaceSessionSwitcherProps) {
  if (sessions.length === 0) {
    return null;
  }
  return (
    <nav
      aria-label="Work domains"
      className="flex items-center gap-2 border-b border-border bg-surface px-4 py-2"
    >
      <ul className="m-0 flex flex-1 list-none items-center gap-2 p-0">
        {sessions.map((session) => {
          const isActive = session.key === activeKey;
          return (
            <li key={session.key} className="flex items-center gap-1">
              <Button
                type="button"
                size="sm"
                variant={isActive ? "default" : "terminal"}
                aria-current={isActive ? "true" : "false"}
                onClick={() => onSelect(session.key)}
              >
                {session.label}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                aria-label={`Close ${session.label}`}
                onClick={() => onClose(session.key)}
              >
                ×
              </Button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
