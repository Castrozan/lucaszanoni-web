import type { PaletteCommand } from "@platform/design-system";
import { cockpitViews } from "../navigation/cockpit-views";
import type { CockpitSession } from "../sessions/session-registry";

export function buildNavigationCommands(
  navigate: (path: string) => void,
): PaletteCommand[] {
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
): PaletteCommand[] {
  return sessions.map((session) => ({
    id: `session:${session.key}`,
    title: `Switch to ${session.label}`,
    run: () => selectSession(session.key),
  }));
}
