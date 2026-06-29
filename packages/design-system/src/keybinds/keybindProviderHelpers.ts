import type { KeyChord } from "./keyChord";

export function activeElementAcceptsTextInput(): boolean {
  const element = document.activeElement as HTMLElement | null;
  if (!element) {
    return false;
  }
  return (
    element.tagName === "INPUT" ||
    element.tagName === "TEXTAREA" ||
    element.isContentEditable
  );
}

export function sameChordSequence(
  first: readonly KeyChord[],
  second: readonly KeyChord[],
): boolean {
  return (
    first.length === second.length &&
    JSON.stringify(first) === JSON.stringify(second)
  );
}
