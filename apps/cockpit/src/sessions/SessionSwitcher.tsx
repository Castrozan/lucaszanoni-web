import { Button } from "@platform/design-system";
import type { CockpitSession } from "./session-registry";

export interface SessionSwitcherProps {
  sessions: readonly CockpitSession[];
  activeKey: string | null;
  onSelect: (key: string) => void;
  onListSessions: () => void;
}

export function SessionSwitcher({
  sessions,
  activeKey,
  onSelect,
  onListSessions,
}: SessionSwitcherProps) {
  if (sessions.length === 0) {
    return null;
  }
  return (
    <nav
      aria-label="Cockpit sessions"
      className="flex items-center gap-2 border-b border-border bg-surface px-4 py-2"
    >
      <ul className="m-0 flex flex-1 list-none items-center gap-2 p-0">
        {sessions.map((session) => {
          const isActive = session.key === activeKey;
          return (
            <li key={session.key}>
              <Button
                type="button"
                size="sm"
                variant={isActive ? "default" : "terminal"}
                aria-current={isActive ? "true" : "false"}
                onClick={() => onSelect(session.key)}
              >
                {session.label}
              </Button>
            </li>
          );
        })}
      </ul>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={onListSessions}
      >
        List sessions
      </Button>
    </nav>
  );
}
