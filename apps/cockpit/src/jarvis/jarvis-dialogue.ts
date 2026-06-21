export type JarvisSpeaker = "owner" | "jarvis";

export interface JarvisUtterance {
  readonly speaker: JarvisSpeaker;
  readonly text: string;
}

export function composeJarvisAcknowledgement(ownerMessage: string): string {
  const trimmed = ownerMessage.trim();
  if (trimmed.length === 0) {
    return "I'm listening.";
  }
  return `Standing by on: ${trimmed}`;
}

export function appendOwnerMessage(
  transcript: readonly JarvisUtterance[],
  text: string,
): readonly JarvisUtterance[] {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return transcript;
  }
  return [
    ...transcript,
    { speaker: "owner", text: trimmed },
    { speaker: "jarvis", text: composeJarvisAcknowledgement(trimmed) },
  ];
}
