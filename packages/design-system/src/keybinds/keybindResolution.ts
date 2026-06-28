import {
  type KeyChord,
  eventChordMatchesBindingChord,
  parseChordToken,
} from "./keyChord";

export interface ResolvedKeybind {
  readonly id: string;
  readonly chords: readonly KeyChord[];
  readonly allowInInput: boolean;
}

export type SequenceMatch =
  | { readonly type: "exact"; readonly id: string }
  | { readonly type: "prefix" }
  | { readonly type: "none" };

export function parseBinding(
  binding: string,
  leaderChords: readonly KeyChord[],
): KeyChord[] {
  const tokens = binding.split(/\s+/).filter((token) => token.length > 0);
  const chords: KeyChord[] = [];
  for (const token of tokens) {
    if (token.toLowerCase() === "leader") {
      chords.push(...leaderChords);
    } else {
      chords.push(parseChordToken(token));
    }
  }
  return chords;
}

function pendingMatchesBindingPrefix(
  pending: readonly KeyChord[],
  bindingChords: readonly KeyChord[],
): boolean {
  if (pending.length > bindingChords.length) {
    return false;
  }
  return pending.every((pendingChord, index) =>
    eventChordMatchesBindingChord(pendingChord, bindingChords[index]),
  );
}

export function matchPendingSequence(
  pending: readonly KeyChord[],
  bindings: readonly ResolvedKeybind[],
): SequenceMatch {
  const exact = bindings.find(
    (binding) =>
      binding.chords.length === pending.length &&
      pendingMatchesBindingPrefix(pending, binding.chords),
  );
  if (exact) {
    return { type: "exact", id: exact.id };
  }
  const hasPrefix = bindings.some(
    (binding) =>
      binding.chords.length > pending.length &&
      pendingMatchesBindingPrefix(pending, binding.chords),
  );
  return hasPrefix ? { type: "prefix" } : { type: "none" };
}
