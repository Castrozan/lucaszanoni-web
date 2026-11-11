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

export const SNAPSHOT_ARTIFACT_LOCATIONS = createSnapshotArtifactLocations(
  artifactStore.baseUrl,
);
