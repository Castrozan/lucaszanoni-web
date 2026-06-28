import { useKeybind } from "./useKeybind";
import type { KeybindNavigationAction } from "./keybindNavigationActionList";

export interface KeybindNavActionProps {
  readonly action: KeybindNavigationAction;
}

export function KeybindNavAction({ action }: KeybindNavActionProps) {
  useKeybind({
    id: action.id,
    label: action.label,
    defaultBinding: action.defaultBinding,
    run: () => {
      window.location.assign(action.href);
    },
  });
  return null;
}
