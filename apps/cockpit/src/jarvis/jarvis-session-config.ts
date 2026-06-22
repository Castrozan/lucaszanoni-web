const JARVIS_SESSION_EDGE_PATH = "/cockpit/jarvis-session/";

export function resolveJarvisSessionEndpoint(): string | null {
  const configuredEndpoint = import.meta.env.VITE_JARVIS_SESSION_WS_URL;
  if (typeof configuredEndpoint === "string" && configuredEndpoint.length > 0) {
    return configuredEndpoint;
  }
  if (typeof window === "undefined" || !window.location?.host) {
    return null;
  }
  const websocketScheme = window.location.protocol === "https:" ? "wss" : "ws";
  return `${websocketScheme}://${window.location.host}${JARVIS_SESSION_EDGE_PATH}`;
}
