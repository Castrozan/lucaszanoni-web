export type ArtifactObjectKind = "report" | "raw-snapshot";

export interface ArtifactWrite {
  readonly objectKey: string;
  readonly objectKind: ArtifactObjectKind;
  readonly contentType: string;
  readonly bytes: Uint8Array;
}

export interface ArtifactObjectWriter {
  writeArtifact(artifactWrite: ArtifactWrite): Promise<void>;
}
