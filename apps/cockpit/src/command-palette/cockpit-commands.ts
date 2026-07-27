import type { PaletteCommand } from "@platform/design-system";
import { cockpitViews } from "../navigation/cockpit-views";

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
