import type { IngestedSnapshotRecord } from "@platform/ingestion-contracts";

export interface SnapshotWrite {
  readonly eventObjectKey: string;
  readonly record: IngestedSnapshotRecord;
}

export interface SnapshotObjectWriter {
  writeSnapshot(snapshotWrite: SnapshotWrite): Promise<void>;
}
