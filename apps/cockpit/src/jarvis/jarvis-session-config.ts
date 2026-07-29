import { resolveEdgeWebsocketEndpoint } from "@platform/workspace";

const JARVIS_SESSION_EDGE_PATH = "/cockpit/jarvis-session/";

export function resolveJarvisSessionEndpoint(): string | null {
  return resolveEdgeWebsocketEndpoint(
    import.meta.env.VITE_JARVIS_SESSION_WS_URL,
    JARVIS_SESSION_EDGE_PATH,
  );
}
