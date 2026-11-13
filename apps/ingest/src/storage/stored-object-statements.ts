import type { ArtifactObjectKind } from "../artifact-object-writer";
import { splitIntoChunks } from "./object-chunking";
import type { SnapshotDatabase } from "./snapshot-database";

export type StoredObjectKind = ArtifactObjectKind | "event";

export interface StoredObjectWrite {
  readonly objectKey: string;
  readonly objectKind: StoredObjectKind;
  readonly contentType: string;
  readonly bytes: Uint8Array;
}

const INSERT_OBJECT_SQL = `INSERT INTO snapshot_objects (object_key, object_kind, content_type, byte_length, chunk_count)
VALUES (?1, ?2, ?3, ?4, ?5)`;

const UPSERT_OBJECT_SQL = `${INSERT_OBJECT_SQL}
ON CONFLICT(object_key) DO UPDATE SET
  object_kind = excluded.object_kind,
  content_type = excluded.content_type,
  byte_length = excluded.byte_length,
  chunk_count = excluded.chunk_count`;

const DELETE_CHUNKS_SQL =
  "DELETE FROM snapshot_object_chunks WHERE object_key = ?1";

const INSERT_CHUNK_SQL =
  "INSERT INTO snapshot_object_chunks (object_key, chunk_index, bytes) VALUES (?1, ?2, ?3)";

const INSERT_IMMUTABLE_CHUNK_SQL = `INSERT INTO snapshot_object_chunks (object_key, chunk_index, bytes)
SELECT ?1, ?2, ?3
WHERE ?2 < (SELECT chunk_count FROM snapshot_objects WHERE object_key = ?1)
ON CONFLICT(object_key, chunk_index) DO NOTHING`;

const UPSERT_LATEST_SQL = `INSERT INTO snapshot_latest (topic, event_object_key, produced_at_epoch)
VALUES (?1, ?2, ?3)
ON CONFLICT(topic) DO UPDATE SET
  event_object_key = excluded.event_object_key,
  produced_at_epoch = excluded.produced_at_epoch
WHERE excluded.produced_at_epoch > snapshot_latest.produced_at_epoch
  OR (
    excluded.produced_at_epoch = snapshot_latest.produced_at_epoch
    AND excluded.event_object_key >= snapshot_latest.event_object_key
  )`;

export function buildObjectWriteStatements(
  database: SnapshotDatabase,
  objectWrite: StoredObjectWrite,
): D1PreparedStatement[] {
  const chunks = splitIntoChunks(objectWrite.bytes);
  const immutable = objectWrite.objectKind === "event";
  return [
    database
      .prepare(
        immutable
          ? `${INSERT_OBJECT_SQL} ON CONFLICT(object_key) DO NOTHING`
          : UPSERT_OBJECT_SQL,
      )
      .bind(
        objectWrite.objectKey,
        objectWrite.objectKind,
        objectWrite.contentType,
        objectWrite.bytes.byteLength,
        chunks.length,
      ),
    ...(immutable
      ? []
      : [database.prepare(DELETE_CHUNKS_SQL).bind(objectWrite.objectKey)]),
    ...chunks.map((chunk, chunkIndex) =>
      database
        .prepare(immutable ? INSERT_IMMUTABLE_CHUNK_SQL : INSERT_CHUNK_SQL)
        .bind(objectWrite.objectKey, chunkIndex, chunk.slice().buffer),
    ),
  ];
}

export function buildLatestPointerStatement(
  database: SnapshotDatabase,
  topic: string,
  eventObjectKey: string,
  producedAtEpoch: number,
): D1PreparedStatement {
  return database
    .prepare(UPSERT_LATEST_SQL)
    .bind(topic, eventObjectKey, producedAtEpoch);
}
