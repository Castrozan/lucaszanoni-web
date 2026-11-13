import type {
  ArtifactObjectWriter,
  ArtifactWrite,
} from "../src/artifact-object-writer";
import type {
  SnapshotObjectWriter,
  SnapshotWrite,
} from "../src/snapshot-object-writer";

export interface RecordingSnapshotObjectWriter extends SnapshotObjectWriter {
  readonly writes: SnapshotWrite[];
}

export function createRecordingSnapshotObjectWriter(): RecordingSnapshotObjectWriter {
  const writes: SnapshotWrite[] = [];
  return {
    writes,
    async writeSnapshot(snapshotWrite) {
      writes.push(snapshotWrite);
    },
  };
}

export function createFailingSnapshotObjectWriter(
  failureMessage: string,
): SnapshotObjectWriter {
  return {
    async writeSnapshot() {
      throw new Error(failureMessage);
    },
  };
}

export interface RecordingArtifactObjectWriter extends ArtifactObjectWriter {
  readonly writes: ArtifactWrite[];
}

export function createRecordingArtifactObjectWriter(): RecordingArtifactObjectWriter {
  const writes: ArtifactWrite[] = [];
  return {
    writes,
    async writeArtifact(artifactWrite) {
      writes.push(artifactWrite);
    },
  };
}

export function createFailingArtifactObjectWriter(
  failureMessage: string,
): ArtifactObjectWriter {
  return {
    async writeArtifact() {
      throw new Error(failureMessage);
    },
  };
}
