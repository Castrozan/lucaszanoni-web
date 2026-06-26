import { cockpitViews } from "../navigation/cockpit-views";
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
