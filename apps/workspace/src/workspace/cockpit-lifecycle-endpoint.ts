const COCKPIT_LIFECYCLE_EDGE_PATH = "/cockpit/lifecycle";

export function resolveCockpitLifecycleEndpoint(): string | null {
  const configuredEndpoint = import.meta.env.VITE_COCKPIT_LIFECYCLE_WS_URL;
  if (typeof configuredEndpoint === "string" && configuredEndpoint.length > 0) {
    return configuredEndpoint;
  }
  if (typeof window === "undefined" || !window.location?.host) {
    return null;
  }
  const websocketScheme = window.location.protocol === "https:" ? "wss" : "ws";
  return `${websocketScheme}://${window.location.host}${COCKPIT_LIFECYCLE_EDGE_PATH}`;
}
