export const HEALTH_PROBE_PATH = "/livez";

export type IngestRequestTarget =
  | { readonly kind: "health" }
  | { readonly kind: "ingest"; readonly topic: string }
  | { readonly kind: "method-not-allowed" }
  | { readonly kind: "not-found" };

function withTrailingSlash(mountPath: string): string {
  return mountPath.endsWith("/") ? mountPath : `${mountPath}/`;
}

export function resolveIngestRequestTarget(
  mountPath: string,
  method: string,
  pathname: string,
): IngestRequestTarget {
  if (pathname === HEALTH_PROBE_PATH) {
    return method === "GET"
      ? { kind: "health" }
      : { kind: "method-not-allowed" };
  }

  const mountPrefix = withTrailingSlash(mountPath);
  if (!pathname.startsWith(mountPrefix)) {
    return { kind: "not-found" };
  }

  const topic = pathname.slice(mountPrefix.length);
  if (topic === "" || topic.includes("/")) {
    return { kind: "not-found" };
  }

  return method === "POST"
    ? { kind: "ingest", topic }
    : { kind: "method-not-allowed" };
}
