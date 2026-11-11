import type { SnapshotLoadStatus } from "../../data/ingested-snapshot-state";

export function snapshotLoadStatusLabel(
  status: Exclude<SnapshotLoadStatus, "ready">,
): string {
  return {
    loading: "loading snapshot",
    missing: "nothing ingested yet",
    malformed: "snapshot malformed",
    unavailable: "snapshot unavailable",
  }[status];
}
