import type { SnapshotSourceConfiguration } from "@platform/snapshot-data";

export const USAGE_SNAPSHOT_SOURCE: SnapshotSourceConfiguration = {
  snapshotsBucket: "zg-url-shortener-2026-dotfiles-usage-snapshots",
  snapshotsObjectPrefix: "snapshots/",
};

export const LIVE_REFRESH_INTERVAL_MILLISECONDS = 30000;
