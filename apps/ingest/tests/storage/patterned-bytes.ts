export function patternedBytes(length: number, seed: number): Uint8Array {
  const bytes = new Uint8Array(length);
  for (let index = 0; index < length; index += 1) {
    bytes[index] = (index * 131 + (index >>> 8) * 17 + seed) % 256;
  }
  return bytes;
}
