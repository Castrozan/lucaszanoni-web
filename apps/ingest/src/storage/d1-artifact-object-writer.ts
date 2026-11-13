import type { ArtifactObjectWriter } from "../artifact-object-writer";
import type { SnapshotDatabase } from "./snapshot-database";
import { buildObjectWriteStatements } from "./stored-object-statements";

export function createD1ArtifactObjectWriter(
  database: SnapshotDatabase,
): ArtifactObjectWriter {
  return {
    async writeArtifact(artifactWrite) {
      await database.batch(buildObjectWriteStatements(database, artifactWrite));
    },
  };
}
