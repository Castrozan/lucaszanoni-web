const spokenInputEncoder = new TextEncoder();

export function encodeSpokenSessionInput(
  transcript: string,
): Uint8Array | null {
  const trimmed = transcript.trim();
  if (trimmed.length === 0) {
    return null;
  }
  return spokenInputEncoder.encode(`${trimmed}\r`);
}
