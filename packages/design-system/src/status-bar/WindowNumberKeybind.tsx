import {
  buildPlatformSessions,
  findActiveLocation,
  windowIndexFromOneBasedNumber,
} from "@platform/config";
import { useKeybind } from "../keybinds/useKeybind";
import { navigateToWindowPath } from "./statusBarNavigation";

export interface WindowNumberKeybindProps {
  readonly oneBasedNumber: number;
}

export function WindowNumberKeybind({
  oneBasedNumber,
}: WindowNumberKeybindProps) {
  useKeybind({
    id: `tmux.window.jump.${oneBasedNumber}`,
    label: `Window ${oneBasedNumber}`,
    defaultBinding: `Leader ${oneBasedNumber}`,
    allowInInput: true,
    run: () => {
      const active = findActiveLocation(
        buildPlatformSessions(),
        window.location.pathname,
      );
      if (!active) {
        return;
      }
      navigateToWindowPath(
        active,
        windowIndexFromOneBasedNumber(
          active.session.windows.length,
          oneBasedNumber,
        ),
      );
    },
  });
  return null;
}
