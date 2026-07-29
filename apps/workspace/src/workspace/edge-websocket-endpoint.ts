export function resolveEdgeWebsocketEndpoint(
  configuredEndpoint: unknown,
  edgePath: string,
): string | null {
  if (typeof configuredEndpoint === "string" && configuredEndpoint.length > 0) {
    return configuredEndpoint;
  }
  if (typeof window === "undefined" || !window.location?.host) {
    return null;
  }
  const websocketScheme = window.location.protocol === "https:" ? "wss" : "ws";
  return `${websocketScheme}://${window.location.host}${edgePath}`;
}
