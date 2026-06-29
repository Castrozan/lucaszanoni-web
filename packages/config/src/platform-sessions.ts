import { MICRO_FRONTEND_ROUTES } from "./route-registry";
import type { MicroFrontendId } from "./route-registry";

export interface PlatformWindow {
  readonly id: string;
  readonly label: string;
  readonly path: string;
}

const SESSION_WINDOW_DECLARATIONS: Partial<
  Record<MicroFrontendId, readonly PlatformWindow[]>
> = {
  cockpit: [
    { id: "cockpit", label: "Cockpit", path: "/cockpit/" },
    { id: "cockpit-dashboard", label: "Dashboard", path: "/cockpit/dashboard" },
    { id: "cockpit-jarvis", label: "Jarvis", path: "/cockpit/jarvis" },
    { id: "cockpit-user", label: "User", path: "/cockpit/user" },
  ],
  reports: [
    {
      id: "reports",
      label: "Reports",
      path: "/engineering/dotfiles/reports/",
    },
    {
      id: "reports-quality",
      label: "Quality",
      path: "/engineering/dotfiles/reports/quality",
    },
    {
      id: "reports-baseline",
      label: "Baseline",
      path: "/engineering/dotfiles/reports/baseline",
    },
    {
      id: "reports-coverage",
      label: "Coverage",
      path: "/engineering/dotfiles/reports/coverage",
    },
  ],
};

export interface PlatformSession {
  readonly id: MicroFrontendId;
  readonly label: string;
  readonly mountPath: string;
  readonly windows: readonly PlatformWindow[];
}

export interface ActivePlatformLocation {
  readonly session: PlatformSession;
  readonly sessionIndex: number;
  readonly window: PlatformWindow;
  readonly windowIndex: number;
}

const SESSION_EXCLUDED_IDS: ReadonlySet<MicroFrontendId> = new Set(["db"]);

function mountPathIsAncestorOf(
  ancestorMountPath: string,
  descendantMountPath: string,
): boolean {
  return (
    ancestorMountPath !== "/" &&
    ancestorMountPath.endsWith("/") &&
    descendantMountPath !== ancestorMountPath &&
    descendantMountPath.startsWith(ancestorMountPath)
  );
}

function pathnameIsWithin(coveringPath: string, pathname: string): boolean {
  const normalizedPathname = pathname.endsWith("/") ? pathname : `${pathname}/`;
  return (
    normalizedPathname === coveringPath ||
    normalizedPathname.startsWith(coveringPath)
  );
}

export function buildPlatformSessions(): PlatformSession[] {
  const candidateRoutes = MICRO_FRONTEND_ROUTES.filter(
    (route) => !SESSION_EXCLUDED_IDS.has(route.id),
  );
  const topLevelRoutes = candidateRoutes.filter(
    (route) =>
      !candidateRoutes.some((other) =>
        mountPathIsAncestorOf(other.mountPath, route.mountPath),
      ),
  );
  return topLevelRoutes.map((sessionRoute) => {
    const declaredWindows = SESSION_WINDOW_DECLARATIONS[sessionRoute.id];
    const baseWindows: PlatformWindow[] = declaredWindows
      ? declaredWindows.map((declaredWindow) => ({ ...declaredWindow }))
      : [
          {
            id: sessionRoute.id,
            label: sessionRoute.navigationLabel,
            path: sessionRoute.mountPath,
          },
        ];
    const baseWindowPaths = new Set(baseWindows.map((window) => window.path));
    const childWindows = candidateRoutes
      .filter((route) =>
        mountPathIsAncestorOf(sessionRoute.mountPath, route.mountPath),
      )
      .filter((route) => !baseWindowPaths.has(route.mountPath))
      .map((route) => ({
        id: route.id,
        label: route.navigationLabel,
        path: route.mountPath,
      }));
    return {
      id: sessionRoute.id,
      label: sessionRoute.navigationLabel,
      mountPath: sessionRoute.mountPath,
      windows: [...baseWindows, ...childWindows],
    };
  });
}

export function findActiveLocation(
  sessions: readonly PlatformSession[],
  pathname: string,
): ActivePlatformLocation | null {
  if (pathname.length === 0) {
    return null;
  }
  let activeSessionIndex = -1;
  let activeSession: PlatformSession | undefined;
  sessions.forEach((session, index) => {
    if (!pathnameIsWithin(session.mountPath, pathname)) {
      return;
    }
    if (
      activeSession === undefined ||
      session.mountPath.length > activeSession.mountPath.length
    ) {
      activeSessionIndex = index;
      activeSession = session;
    }
  });
  if (activeSession === undefined) {
    return null;
  }
  let windowIndex = 0;
  let activeWindow: PlatformWindow | undefined = activeSession.windows[0];
  activeSession.windows.forEach((platformWindow, index) => {
    if (!pathnameIsWithin(platformWindow.path, pathname)) {
      return;
    }
    if (
      activeWindow === undefined ||
      platformWindow.path.length > activeWindow.path.length
    ) {
      windowIndex = index;
      activeWindow = platformWindow;
    }
  });
  if (activeWindow === undefined) {
    return null;
  }
  return {
    session: activeSession,
    sessionIndex: activeSessionIndex,
    window: activeWindow,
    windowIndex,
  };
}

export function nextWindowIndex(
  windowCount: number,
  currentIndex: number,
): number {
  return windowCount === 0 ? -1 : (currentIndex + 1) % windowCount;
}

export function previousWindowIndex(
  windowCount: number,
  currentIndex: number,
): number {
  return windowCount === 0
    ? -1
    : (currentIndex - 1 + windowCount) % windowCount;
}

export function windowIndexFromOneBasedNumber(
  windowCount: number,
  oneBasedNumber: number,
): number {
  const zeroBasedIndex = oneBasedNumber - 1;
  return zeroBasedIndex >= 0 && zeroBasedIndex < windowCount
    ? zeroBasedIndex
    : -1;
}
