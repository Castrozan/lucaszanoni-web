export function resolveJarvisSessionEndpoint(): string | null {
  const configuredEndpoint = import.meta.env.VITE_JARVIS_SESSION_WS_URL;
  return typeof configuredEndpoint === "string" && configuredEndpoint.length > 0
    ? configuredEndpoint
    : null;
}
