import {
  buildPlatformSessions,
  findActiveLocation,
  nextWindowIndex,
  previousWindowIndex,
} from "@platform/config";
import { useKeybind } from "../keybinds/useKeybind";
import { openCommandPalette } from "../command-palette/CommandPalette";
import { WindowNumberKeybind } from "./WindowNumberKeybind";
import { navigateToWindowPath } from "./statusBarNavigation";

export interface StatusBarKeybindsProps {
  readonly windowCount: number;
}

function cycleWindow(
  resolveIndex: (windowCount: number, currentIndex: number) => number,
) {
  const active = findActiveLocation(
    buildPlatformSessions(),
    window.location.pathname,
  );
  if (!active) {
    return;
  }
  navigateToWindowPath(
    active,
    resolveIndex(active.session.windows.length, active.windowIndex),
  );
}

export function StatusBarKeybinds({ windowCount }: StatusBarKeybindsProps) {
  useKeybind({
    id: "tmux.sessions",
    label: "List sessions",
    defaultBinding: "Leader s",
    run: () => openCommandPalette(),
  });
  useKeybind({
    id: "tmux.window.next",
    label: "Next window",
    defaultBinding: "Leader n",
    run: () => cycleWindow(nextWindowIndex),
  });
  useKeybind({
    id: "tmux.window.previous",
    label: "Previous window",
    defaultBinding: "Leader p",
    run: () => cycleWindow(previousWindowIndex),
  });
  return (
    <>
      {Array.from(
        { length: Math.min(Math.max(windowCount, 0), 9) },
        (_, index) => (
          <WindowNumberKeybind key={index} oneBasedNumber={index + 1} />
        ),
      )}
    </>
  );
}
