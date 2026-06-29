import { useKeybind } from "../keybinds/useKeybind";
import { openCommandPalette } from "../command-palette/CommandPalette";

export function SessionsKeybind() {
  useKeybind({
    id: "tmux.sessions",
    label: "List sessions",
    defaultBinding: "Leader s",
    run: () => openCommandPalette(),
  });
  return null;
}
