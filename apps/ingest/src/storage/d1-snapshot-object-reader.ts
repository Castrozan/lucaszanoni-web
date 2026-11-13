import {
  MACHINE_USAGE_AGGREGATE_OBJECT_KEY,
  type SnapshotObjectReader,
  type StoredSnapshotObject,
} from "../snapshot-object-reader";
import { readRawSnapshotAggregate } from "./d1-raw-snapshot-aggregate-reader";
import { bytesFromDatabaseValue, concatenateChunks } from "./object-chunking";
import type { SnapshotDatabase } from "./snapshot-database";

const LATEST_OBJECT_KEY_PATTERN =
  /^snapshots\/([A-Za-z0-9][A-Za-z0-9._-]*)\/latest\.json$/;

const OBJECT_BY_KEY_SQL = `SELECT o.content_type AS content_type, o.byte_length AS byte_length, c.bytes AS bytes
FROM snapshot_objects o
LEFT JOIN snapshot_object_chunks c ON c.object_key = o.object_key
WHERE o.object_key = ?1
ORDER BY c.chunk_index`;

const LATEST_OBJECT_BY_TOPIC_SQL = `SELECT o.content_type AS content_type, o.byte_length AS byte_length, c.bytes AS bytes
FROM snapshot_latest l
JOIN snapshot_objects o ON o.object_key = l.event_object_key
LEFT JOIN snapshot_object_chunks c ON c.object_key = o.object_key
WHERE l.topic = ?1
ORDER BY c.chunk_index`;

interface StoredObjectRow {
  readonly content_type: string;
  readonly byte_length: number;
  readonly bytes: unknown;
}

async function readStoredObject(
  database: SnapshotDatabase,
  sql: string,
  parameter: string,
): Promise<StoredSnapshotObject | null> {
  const { results } = await database
    .prepare(sql)
    .bind(parameter)
    .all<StoredObjectRow>();
  const [firstRow] = results;
  if (firstRow === undefined) {
    return null;
  }
  const body = concatenateChunks(
    results
      .filter((row) => row.bytes !== null)
      .map((row) => bytesFromDatabaseValue(row.bytes)),
  );
  if (body.byteLength !== firstRow.byte_length) {
    throw new Error(
      `the stored object holds ${body.byteLength} bytes but its metadata records ${firstRow.byte_length}`,
    );
  }
  return { body, contentType: firstRow.content_type };
}

export function createD1SnapshotObjectReader(
  database: SnapshotDatabase,
): SnapshotObjectReader {
  return {
    async readSnapshotObject(objectKey) {
      if (objectKey === MACHINE_USAGE_AGGREGATE_OBJECT_KEY) {
        return readRawSnapshotAggregate(database);
      }
      const latestMatch = LATEST_OBJECT_KEY_PATTERN.exec(objectKey);
      return latestMatch?.[1] === undefined
        ? readStoredObject(database, OBJECT_BY_KEY_SQL, objectKey)
        : readStoredObject(
            database,
            LATEST_OBJECT_BY_TOPIC_SQL,
            latestMatch[1],
          );
    },
  };
}
