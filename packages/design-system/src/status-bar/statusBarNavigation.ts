import type { ActivePlatformLocation } from "@platform/config";

export function navigateToWindowPath(
  active: ActivePlatformLocation,
  targetWindowIndex: number,
): void {
  if (targetWindowIndex < 0) {
    return;
  }
  const target = active.session.windows[targetWindowIndex];
  if (!target || target.path === active.window.path) {
    return;
  }
  window.location.assign(target.path);
}
