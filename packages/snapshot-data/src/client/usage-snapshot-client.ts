import type { UsageSnapshot } from "../models/usage-snapshot.model";
import type { SnapshotSourceConfiguration } from "./snapshot-source-configuration";

export async function fetchAllSnapshots(
  source: SnapshotSourceConfiguration,
  readSnapshots: typeof fetch = fetch,
): Promise<UsageSnapshot[]> {
  const response = await readSnapshots(source.snapshotUrl, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(
      `combined snapshot fetch failed with status ${response.status}`,
    );
  }
  return (await response.json()) as UsageSnapshot[];
}
