import { resolveEdgeWebsocketEndpoint } from "./edge-websocket-endpoint";

const COCKPIT_LIFECYCLE_EDGE_PATH = "/cockpit/lifecycle";

export function resolveCockpitLifecycleEndpoint(): string | null {
  return resolveEdgeWebsocketEndpoint(
    import.meta.env.VITE_COCKPIT_LIFECYCLE_WS_URL,
    COCKPIT_LIFECYCLE_EDGE_PATH,
  );
}
