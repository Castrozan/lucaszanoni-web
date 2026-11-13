import { createApplicationSnapshotArtifactLocations } from "@platform/config";
import type { SnapshotSourceConfiguration } from "@platform/snapshot-data";

export function createUsageSnapshotSource(
  applicationId: string,
): SnapshotSourceConfiguration {
  return {
    snapshotUrl:
      createApplicationSnapshotArtifactLocations(applicationId)
        .usageSnapshotsUrl,
  };
}

export const LIVE_REFRESH_INTERVAL_MILLISECONDS = 30000;
