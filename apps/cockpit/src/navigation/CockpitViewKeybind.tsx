import { useKeybind } from "@platform/design-system";
import type { CockpitView } from "./cockpit-views";

export interface CockpitViewKeybindProps {
  readonly view: CockpitView;
  readonly navigate: (path: string) => void;
}

export function CockpitViewKeybind({
  view,
  navigate,
}: CockpitViewKeybindProps) {
  useKeybind({
    id: `cockpit.view.${view.id}`,
    label: `Go to ${view.label}`,
    defaultBinding: `Leader g ${view.leaderKey}`,
    run: () => navigate(view.path),
  });
  return null;
}
