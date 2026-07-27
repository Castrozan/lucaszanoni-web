import { buildPlatformSessions, findActiveLocation } from "@platform/config";
import type { StatusBarModel } from "./statusBarModel";

const UNMOUNTED_SESSION_LABEL = "Home";

export function buildPlatformStatusBarModel(pathname: string): StatusBarModel {
  const active = findActiveLocation(buildPlatformSessions(), pathname);
  if (!active) {
    return { sessionLabel: UNMOUNTED_SESSION_LABEL, windows: [] };
  }
  return {
    sessionLabel: active.session.label,
    windows: active.session.windows.map((platformWindow, index) => ({
      kind: "link",
      id: platformWindow.id,
      label: platformWindow.label,
      href: platformWindow.path,
      isActive: index === active.windowIndex,
    })),
  };
}
