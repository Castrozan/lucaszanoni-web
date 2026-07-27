import { useSyncExternalStore } from "react";

const SERVER_RENDERED_PATHNAME = "/";

function subscribeToHistoryNavigation(onNavigate: () => void): () => void {
  window.addEventListener("popstate", onNavigate);
  return () => {
    window.removeEventListener("popstate", onNavigate);
  };
}

export function useCurrentPathname(): string {
  return useSyncExternalStore(
    subscribeToHistoryNavigation,
    () => window.location.pathname,
    () => SERVER_RENDERED_PATHNAME,
  );
}
