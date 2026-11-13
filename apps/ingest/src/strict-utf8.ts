const strictDecoder = new TextDecoder("utf-8", {
  fatal: true,
  ignoreBOM: true,
});

export function decodeStrictUtf8(bytes: Uint8Array): string | undefined {
  try {
    return strictDecoder.decode(bytes);
  } catch {
    return undefined;
  }
}
