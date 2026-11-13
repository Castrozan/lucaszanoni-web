export const HEALTH_PROBE_PATH = "/livez";

const HEALTH_SEGMENT = "livez";
const ARTIFACT_SEGMENT_PREFIX = "artifacts/";

export type IngestRequestTarget =
  | { readonly kind: "health" }
  | { readonly kind: "ingest"; readonly topic: string }
  | { readonly kind: "artifact"; readonly objectKey: string }
  | { readonly kind: "method-not-allowed" }
  | { readonly kind: "not-found" };

function withTrailingSlash(mountPath: string): string {
  return mountPath.endsWith("/") ? mountPath : `${mountPath}/`;
}

function decodeObjectKey(encodedObjectKey: string): string | undefined {
  try {
    return decodeURIComponent(encodedObjectKey);
  } catch {
    return undefined;
  }
}

function resolveArtifactTarget(
  method: string,
  encodedObjectKey: string,
): IngestRequestTarget {
  const objectKey = decodeObjectKey(encodedObjectKey);
  if (objectKey === undefined || objectKey === "") {
    return { kind: "not-found" };
  }
  return method === "PUT"
    ? { kind: "artifact", objectKey }
    : { kind: "method-not-allowed" };
}

export function resolveIngestRequestTarget(
  mountPath: string,
  method: string,
  pathname: string,
): IngestRequestTarget {
  const mountPrefix = withTrailingSlash(mountPath);
  if (
    pathname === HEALTH_PROBE_PATH ||
    pathname === `${mountPrefix}${HEALTH_SEGMENT}`
  ) {
    return method === "GET"
      ? { kind: "health" }
      : { kind: "method-not-allowed" };
  }

  if (!pathname.startsWith(mountPrefix)) {
    return { kind: "not-found" };
  }

  const remainder = pathname.slice(mountPrefix.length);
  if (remainder.startsWith(ARTIFACT_SEGMENT_PREFIX)) {
    return resolveArtifactTarget(
      method,
      remainder.slice(ARTIFACT_SEGMENT_PREFIX.length),
    );
  }
  if (remainder === "" || remainder.includes("/")) {
    return { kind: "not-found" };
  }

  return method === "POST"
    ? { kind: "ingest", topic: remainder }
    : { kind: "method-not-allowed" };
}
