export const MAXIMUM_CHUNK_BYTES = 1_000_000;

export function splitIntoChunks(bytes: Uint8Array): Uint8Array[] {
  const chunks: Uint8Array[] = [];
  for (
    let offset = 0;
    offset < bytes.byteLength;
    offset += MAXIMUM_CHUNK_BYTES
  ) {
    chunks.push(bytes.subarray(offset, offset + MAXIMUM_CHUNK_BYTES));
  }
  return chunks;
}

export function concatenateChunks(chunks: readonly Uint8Array[]): Uint8Array {
  const totalByteCount = chunks.reduce(
    (byteCount, chunk) => byteCount + chunk.byteLength,
    0,
  );
  const combined = new Uint8Array(totalByteCount);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return combined;
}

export function bytesFromDatabaseValue(value: unknown): Uint8Array {
  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value);
  }
  if (Array.isArray(value)) {
    return Uint8Array.from(value as number[]);
  }
  throw new Error("the stored chunk is not a binary value");
}
