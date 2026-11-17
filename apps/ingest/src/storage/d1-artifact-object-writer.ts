import type { ArtifactObjectWriter } from "../artifact-object-writer";
import type { SnapshotDatabase } from "./snapshot-database";
import { buildObjectWriteStatements } from "./stored-object-statements";

export function createD1ArtifactObjectWriter(
  database: SnapshotDatabase,
): ArtifactObjectWriter {
  return {
    async writeArtifact(artifactWrite) {
      const statements = buildObjectWriteStatements(database, artifactWrite);
      const results = await database.batch(statements);
      if (results.length !== statements.length) {
        throw new Error("the database returned incomplete write statistics");
      }
      let rowsRead = 0;
      let rowsWritten = 0;
      for (const result of results) {
        if (
          !result.success ||
          !Number.isSafeInteger(result.meta?.rows_read) ||
          !Number.isSafeInteger(result.meta?.rows_written) ||
          result.meta.rows_read < 0 ||
          result.meta.rows_written < 0
        ) {
          throw new Error("the database returned invalid write statistics");
        }
        rowsRead += result.meta.rows_read;
        rowsWritten += result.meta.rows_written;
      }
      return { rowsRead, rowsWritten };
    },
  };
}
