import { nextWindowIndex, previousWindowIndex } from "@platform/config";
import { useKeybind } from "../keybinds/useKeybind";
import { WindowNumberKeybind } from "./WindowNumberKeybind";
import { SessionsKeybind } from "./SessionsKeybind";
import { activateStatusBarWindowAtIndex } from "./statusBarNavigation";
import type { StatusBarWindowModel } from "./statusBarModel";

const HIGHEST_NUMBERED_WINDOW = 9;

export interface StatusBarKeybindsProps {
  readonly windows: readonly StatusBarWindowModel[];
  readonly registerSessionKeybind?: boolean;
}

export function StatusBarKeybinds({
  windows,
  registerSessionKeybind = true,
}: StatusBarKeybindsProps) {
  const activeIndex = windows.findIndex(
    (statusBarWindow) => statusBarWindow.isActive,
  );
  function cycleWindow(
    resolveIndex: (windowCount: number, currentIndex: number) => number,
  ) {
    activateStatusBarWindowAtIndex(
      windows,
      resolveIndex(windows.length, activeIndex),
    );
  }
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
      {registerSessionKeybind ? <SessionsKeybind /> : null}
      {windows.slice(0, HIGHEST_NUMBERED_WINDOW).map((_, index) => (
        <WindowNumberKeybind
          key={index}
          oneBasedNumber={index + 1}
          activate={() => activateStatusBarWindowAtIndex(windows, index)}
        />
      ))}
    </>
  );
}
