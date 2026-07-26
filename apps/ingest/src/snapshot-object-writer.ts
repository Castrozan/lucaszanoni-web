export interface SnapshotObjectWriter {
  writeSnapshotObject(objectKey: string, objectBody: string): Promise<void>;
}
