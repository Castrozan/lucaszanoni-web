import { useKeybind } from "../keybinds/useKeybind";

export interface WindowNumberKeybindProps {
  readonly oneBasedNumber: number;
  readonly activate: () => void;
}

export function WindowNumberKeybind({
  oneBasedNumber,
  activate,
}: WindowNumberKeybindProps) {
  useKeybind({
    id: `tmux.window.jump.${oneBasedNumber}`,
    label: `Window ${oneBasedNumber}`,
    defaultBinding: `Leader ${oneBasedNumber}`,
    run: activate,
  });
  return null;
}
