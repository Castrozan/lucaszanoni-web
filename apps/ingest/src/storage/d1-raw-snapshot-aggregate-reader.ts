import {
  AggregateTooLargeError,
  MAXIMUM_AGGREGATE_STORED_BYTES,
  type StoredSnapshotObject,
} from "../snapshot-object-reader";
import { bytesFromDatabaseValue, concatenateChunks } from "./object-chunking";
import type { SnapshotDatabase } from "./snapshot-database";

const STORED_BYTE_TOTAL_SQL =
  "SELECT COALESCE(SUM(byte_length), 0) AS stored_byte_total FROM snapshot_objects WHERE object_kind = 'raw-snapshot'";

const RAW_SNAPSHOT_CHUNKS_SQL = `SELECT c.object_key AS object_key, c.bytes AS bytes
FROM snapshot_objects o
JOIN snapshot_object_chunks c ON c.object_key = o.object_key
WHERE o.object_kind = 'raw-snapshot'
ORDER BY c.object_key, c.chunk_index`;

const JSON_CONTENT_TYPE = "application/json";

const encoder = new TextEncoder();

export async function readRawSnapshotAggregate(
  database: SnapshotDatabase,
): Promise<StoredSnapshotObject> {
  const totalRow = await database
    .prepare(STORED_BYTE_TOTAL_SQL)
    .first<{ stored_byte_total: number }>();
  const storedByteTotal = totalRow?.stored_byte_total ?? 0;
  if (storedByteTotal > MAXIMUM_AGGREGATE_STORED_BYTES) {
    throw new AggregateTooLargeError(storedByteTotal);
  }

  const { results } = await database
    .prepare(RAW_SNAPSHOT_CHUNKS_SQL)
    .all<{ object_key: string; bytes: unknown }>();

  const objectBodies = new Map<string, Uint8Array[]>();
  for (const row of results) {
    const chunks = objectBodies.get(row.object_key) ?? [];
    chunks.push(bytesFromDatabaseValue(row.bytes));
    objectBodies.set(row.object_key, chunks);
  }

  const parts: Uint8Array[] = [encoder.encode("[")];
  let separator = "";
  for (const chunks of objectBodies.values()) {
    parts.push(encoder.encode(separator), concatenateChunks(chunks));
    separator = ",";
  }
  parts.push(encoder.encode("]"));

  const body = concatenateChunks(parts);
  if (
    body.byteLength >
    MAXIMUM_AGGREGATE_STORED_BYTES + objectBodies.size + 2
  ) {
    throw new AggregateTooLargeError(body.byteLength);
  }
  return { body, contentType: JSON_CONTENT_TYPE };
}
