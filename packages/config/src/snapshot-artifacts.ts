import { appRegistry } from "./app-registry.ts";
import artifactStore from "./snapshot-artifacts.json" with { type: "json" };

export interface SnapshotArtifactLocations {
  readonly artifactStoreBaseUrl: string;
  readonly usageSnapshotsUrl: string;
  readonly reportArtifactsBaseUrl: string;
}

export function createSnapshotArtifactLocations(
  baseUrl: string,
): SnapshotArtifactLocations {
  if (!URL.canParse(baseUrl))
    throw new Error("Snapshot artifact store requires a valid HTTPS base URL");
  const parsed = new URL(baseUrl);
  if (
    !baseUrl.endsWith("/") ||
    parsed.protocol !== "https:" ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error(
      "Snapshot artifact store requires a credential-free HTTPS base URL ending in a slash",
    );
  }
  return {
    artifactStoreBaseUrl: baseUrl,
    usageSnapshotsUrl: new URL(
      "aggregate/machine-usage-snapshots.json",
      baseUrl,
    ).toString(),
    reportArtifactsBaseUrl: new URL("reports/", baseUrl).toString(),
  };
}

export function parseSnapshotSiteOrigin(siteOrigin: string): URL {
  if (!URL.canParse(siteOrigin))
    throw new Error("Snapshot site origin requires a valid HTTPS origin");
  const parsed = new URL(siteOrigin);
  const isBareOrigin =
    siteOrigin === parsed.origin || siteOrigin === `${parsed.origin}/`;
  if (
    parsed.protocol !== "https:" ||
    parsed.username ||
    parsed.password ||
    !isBareOrigin
  ) {
    throw new Error(
      "Snapshot site origin requires a credential-free HTTPS origin without path, query or hash",
    );
  }
  return parsed;
}

const SNAPSHOT_SITE_ORIGIN = parseSnapshotSiteOrigin(artifactStore.siteOrigin);

export function createApplicationSnapshotArtifactLocations(
  applicationId: string,
): SnapshotArtifactLocations {
  const application = appRegistry.find((entry) => entry.id === applicationId);
  if (!application)
    throw new Error(
      `Unknown application for snapshot artifacts: ${applicationId}`,
    );
  return createSnapshotArtifactLocations(
    new URL(`${application.mountPath}data/`, SNAPSHOT_SITE_ORIGIN).toString(),
  );
}
