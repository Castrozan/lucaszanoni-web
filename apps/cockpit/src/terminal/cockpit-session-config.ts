import { resolveEdgeWebsocketEndpoint } from "@platform/workspace";

const COCKPIT_SESSION_EDGE_PATH = "/cockpit/terminal-session/";

export function resolveCockpitSessionEndpoint(): string | null {
  return resolveEdgeWebsocketEndpoint(
    import.meta.env.VITE_COCKPIT_SESSION_WS_URL,
    COCKPIT_SESSION_EDGE_PATH,
  );
}
