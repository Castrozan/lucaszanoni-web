import { cockpitViews } from "../navigation/cockpit-views";
import type { CockpitSession } from "../sessions/session-registry";
import type { CockpitCommand } from "./use-command-palette";

export function buildNavigationCommands(
  navigate: (path: string) => void,
): CockpitCommand[] {
  return cockpitViews.map((view) => ({
    id: `view:${view.id}`,
    title: `Go to ${view.label}`,
    hint: view.path,
    run: () => navigate(view.path),
  }));
}

export function buildSessionCommands(
  sessions: readonly CockpitSession[],
  selectSession: (key: string) => void,
): CockpitCommand[] {
  return sessions.map((session) => ({
    id: `session:${session.key}`,
    title: `Switch to ${session.label}`,
    run: () => selectSession(session.key),
  }));
}
