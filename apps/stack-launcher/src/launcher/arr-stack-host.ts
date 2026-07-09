const HTTP_DEFAULT_PORT = 80;

export function resolveArrStackHost(): string {
  const configuredHost = import.meta.env.VITE_ARR_STACK_HOST;
  if (typeof configuredHost === "string") {
    return configuredHost.trim();
  }
  return "";
}

export function buildArrStackAppUrl(host: string, port: number): string {
  if (port === HTTP_DEFAULT_PORT) {
    return `http://${host}`;
  }
  return `http://${host}:${port}`;
}
