import { parseChordToken } from "./keyChord";

const ASCII_CODE_BEFORE_LOWERCASE_A = 96;

export function controlByteForLeaderBinding(
  leaderBinding: string,
): number | null {
  const chord = parseChordToken(leaderBinding);
  if (!chord.ctrl && !chord.mod) {
    return null;
  }
  if (!/^[a-z]$/.test(chord.key)) {
    return null;
  }
  return chord.key.charCodeAt(0) - ASCII_CODE_BEFORE_LOWERCASE_A;
}
