export interface StoredSnapshotObject {
  readonly body: Uint8Array;
  readonly contentType: string;
}

export interface SnapshotObjectReader {
  readSnapshotObject(objectKey: string): Promise<StoredSnapshotObject | null>;
}

export const MACHINE_USAGE_AGGREGATE_OBJECT_KEY =
  "aggregate/machine-usage-snapshots.json";

export const MAXIMUM_AGGREGATE_STORED_BYTES = 8_000_000;

export class AggregateTooLargeError extends Error {
  constructor(storedByteCount: number) {
    super(
      `the stored raw snapshots total ${storedByteCount} bytes which exceeds the ${MAXIMUM_AGGREGATE_STORED_BYTES} byte aggregate limit`,
    );
    this.name = "AggregateTooLargeError";
  }
}
