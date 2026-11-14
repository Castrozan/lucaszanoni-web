import { MAXIMUM_CHUNK_BYTES } from "../../src/storage/object-chunking";
import type { StoredObjectKind } from "../../src/storage/stored-object-statements";
import type { SnapshotDatabase } from "../../src/storage/snapshot-database";

export interface PaddedStoredObject {
  readonly objectKey: string;
  readonly objectKind: StoredObjectKind;
  readonly leadingText: string;
  readonly paddingByteCount: number;
  readonly trailingText: string;
}

interface PaddedChunk {
  readonly leadingText: string;
  readonly paddingByteCount: number;
  readonly trailingText: string;
}

const PADDING_CHARACTER = "x";

const INSERT_OBJECT_SQL = `INSERT INTO snapshot_objects (object_key, object_kind, content_type, byte_length, chunk_count)
VALUES (?1, ?2, 'application/json', ?3, ?4)`;

const INSERT_PADDED_CHUNK_SQL = `INSERT INTO snapshot_object_chunks (object_key, chunk_index, bytes)
VALUES (?1, ?2, CAST(?3 || replace(hex(zeroblob(?4)), '00', '${PADDING_CHARACTER}') || ?5 AS BLOB))`;

const ASCII_ONLY_PATTERN = /^[\x20-\x7e]*$/;

export function paddedObjectText(paddedObject: PaddedStoredObject): string {
  return `${paddedObject.leadingText}${PADDING_CHARACTER.repeat(paddedObject.paddingByteCount)}${paddedObject.trailingText}`;
}

function overlapLength(
  rangeStart: number,
  rangeEnd: number,
  segmentStart: number,
  segmentEnd: number,
): number {
  return Math.max(
    0,
    Math.min(rangeEnd, segmentEnd) - Math.max(rangeStart, segmentStart),
  );
}

function chunkLayout(paddedObject: PaddedStoredObject): PaddedChunk[] {
  const paddingStart = paddedObject.leadingText.length;
  const paddingEnd = paddingStart + paddedObject.paddingByteCount;
  const byteLength = paddingEnd + paddedObject.trailingText.length;
  const chunks: PaddedChunk[] = [];
  for (
    let chunkStart = 0;
    chunkStart < byteLength;
    chunkStart += MAXIMUM_CHUNK_BYTES
  ) {
    const chunkEnd = Math.min(chunkStart + MAXIMUM_CHUNK_BYTES, byteLength);
    chunks.push({
      leadingText: paddedObject.leadingText.slice(chunkStart, chunkEnd),
      paddingByteCount: overlapLength(
        chunkStart,
        chunkEnd,
        paddingStart,
        paddingEnd,
      ),
      trailingText: paddedObject.trailingText.slice(
        Math.max(0, chunkStart - paddingEnd),
        Math.max(0, chunkEnd - paddingEnd),
      ),
    });
  }
  return chunks;
}

export async function storePaddedObject(
  database: SnapshotDatabase,
  paddedObject: PaddedStoredObject,
): Promise<void> {
  if (
    !ASCII_ONLY_PATTERN.test(paddedObject.leadingText) ||
    !ASCII_ONLY_PATTERN.test(paddedObject.trailingText)
  ) {
    throw new Error("padded objects take printable ASCII text only");
  }
  const chunks = chunkLayout(paddedObject);
  const byteLength = chunks.reduce(
    (total, chunk) =>
      total +
      chunk.leadingText.length +
      chunk.paddingByteCount +
      chunk.trailingText.length,
    0,
  );
  await database.batch([
    database
      .prepare(INSERT_OBJECT_SQL)
      .bind(
        paddedObject.objectKey,
        paddedObject.objectKind,
        byteLength,
        chunks.length,
      ),
    ...chunks.map((chunk, chunkIndex) =>
      database
        .prepare(INSERT_PADDED_CHUNK_SQL)
        .bind(
          paddedObject.objectKey,
          chunkIndex,
          chunk.leadingText,
          chunk.paddingByteCount,
          chunk.trailingText,
        ),
    ),
  ]);
}
