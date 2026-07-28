import type { UsageSnapshot } from "../models/usage-snapshot.model";
import type { SnapshotSourceConfiguration } from "./snapshot-source-configuration";

export async function fetchAllSnapshots(
  source: SnapshotSourceConfiguration,
): Promise<UsageSnapshot[]> {
  const combinedSnapshotsUrl = `https://storage.googleapis.com/${source.snapshotsBucket}/${source.combinedSnapshotsObjectName}`;
  const response = await fetch(combinedSnapshotsUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(
      `combined snapshot fetch failed with status ${response.status}`,
    );
  }
  return (await response.json()) as UsageSnapshot[];
}
