import type { StatusBarWindowModel } from "./statusBarModel";

export function activateStatusBarWindow(
  statusBarWindow: StatusBarWindowModel,
): void {
  if (statusBarWindow.isActive) {
    return;
  }
  if (statusBarWindow.kind === "link") {
    window.location.assign(statusBarWindow.href);
    return;
  }
  statusBarWindow.onSelect();
}

export function activateStatusBarWindowAtIndex(
  windows: readonly StatusBarWindowModel[],
  targetIndex: number,
): void {
  const target = windows[targetIndex];
  if (target) {
    activateStatusBarWindow(target);
  }
}
