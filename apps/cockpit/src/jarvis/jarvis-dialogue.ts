export type JarvisSpeaker = "owner" | "jarvis";

export interface JarvisUtterance {
  readonly speaker: JarvisSpeaker;
  readonly text: string;
}

export function appendOwnerMessage(
  transcript: readonly JarvisUtterance[],
  text: string,
): readonly JarvisUtterance[] {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return transcript;
  }
  return [...transcript, { speaker: "owner", text: trimmed }];
}

export function appendJarvisReply(
  transcript: readonly JarvisUtterance[],
  text: string,
): readonly JarvisUtterance[] {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return transcript;
  }
  return [...transcript, { speaker: "jarvis", text: trimmed }];
}
