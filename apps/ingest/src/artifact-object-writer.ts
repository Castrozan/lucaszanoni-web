export type ArtifactObjectKind = "report" | "raw-snapshot";

export interface ArtifactWrite {
  readonly objectKey: string;
  readonly objectKind: ArtifactObjectKind;
  readonly contentType: string;
  readonly bytes: Uint8Array;
}

export interface ArtifactStorageStatistics {
  readonly rowsRead: number;
  readonly rowsWritten: number;
}

export interface ArtifactObjectWriter {
  writeArtifact(
    artifactWrite: ArtifactWrite,
  ): Promise<ArtifactStorageStatistics>;
}
