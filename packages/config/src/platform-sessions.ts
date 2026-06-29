import { MICRO_FRONTEND_ROUTES } from "./route-registry";
import type { MicroFrontendId } from "./route-registry";

export interface PlatformWindow {
  readonly id: MicroFrontendId;
  readonly label: string;
  readonly path: string;
}

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
    const childWindows = candidateRoutes
      .filter((route) =>
        mountPathIsAncestorOf(sessionRoute.mountPath, route.mountPath),
      )
      .map((route) => ({
        id: route.id,
        label: route.navigationLabel,
        path: route.mountPath,
      }));
    return {
      id: sessionRoute.id,
      label: sessionRoute.navigationLabel,
      mountPath: sessionRoute.mountPath,
      windows: [
        {
          id: sessionRoute.id,
          label: sessionRoute.navigationLabel,
          path: sessionRoute.mountPath,
        },
        ...childWindows,
      ],
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
  sessions.forEach((session, index) => {
    if (!pathnameIsWithin(session.mountPath, pathname)) {
      return;
    }
    if (
      activeSessionIndex === -1 ||
      session.mountPath.length > sessions[activeSessionIndex].mountPath.length
    ) {
      activeSessionIndex = index;
    }
  });
  if (activeSessionIndex === -1) {
    return null;
  }
  const session = sessions[activeSessionIndex];
  let windowIndex = 0;
  session.windows.forEach((platformWindow, index) => {
    if (!pathnameIsWithin(platformWindow.path, pathname)) {
      return;
    }
    if (platformWindow.path.length > session.windows[windowIndex].path.length) {
      windowIndex = index;
    }
  });
  return {
    session,
    sessionIndex: activeSessionIndex,
    window: session.windows[windowIndex],
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
