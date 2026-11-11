import { SNAPSHOT_ARTIFACT_LOCATIONS } from "@platform/config";
import type { SnapshotSourceConfiguration } from "@platform/snapshot-data";

export const USAGE_SNAPSHOT_SOURCE: SnapshotSourceConfiguration = {
  snapshotUrl: SNAPSHOT_ARTIFACT_LOCATIONS.usageSnapshotsUrl,
};

export const LIVE_REFRESH_INTERVAL_MILLISECONDS = 30000;
