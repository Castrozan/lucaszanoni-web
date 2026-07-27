import type { StatusBarWindowModel } from "./statusBarModel";

export function activateStatusBarWindow(
  statusBarWindow: StatusBarWindowModel,
): void {
  if (statusBarWindow.kind === "action") {
    statusBarWindow.onSelect();
    return;
  }
  if (statusBarWindow.isActive) {
    return;
  }
  window.location.assign(statusBarWindow.href);
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
