import { useEffect, type MutableRefObject } from "react";
import { chordFromKeyboardEvent, type KeyChord } from "./keyChord";
import {
  matchPendingSequence,
  type ResolvedKeybind,
} from "./keybindResolution";
import {
  activeElementAcceptsTextInput,
  sameChordSequence,
} from "./keybindProviderHelpers";
import type { KeybindRegistration } from "./keybindContext";

const SEQUENCE_RESET_MS = 1500;

export function useKeybindSequenceListener(
  resolvedBindings: ResolvedKeybind[],
  registryReference: MutableRefObject<Map<string, KeybindRegistration>>,
  setIsSequencePending: (pending: boolean) => void,
): void {
  useEffect(() => {
    let pending: KeyChord[] = [];
    let resetTimeoutId: ReturnType<typeof setTimeout> | undefined;
    function clearPending() {
      pending = [];
      if (resetTimeoutId) {
        clearTimeout(resetTimeoutId);
        resetTimeoutId = undefined;
      }
      setIsSequencePending(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      const chord = chordFromKeyboardEvent(event);
      if (!chord) {
        return;
      }
      const candidateBindings = activeElementAcceptsTextInput()
        ? resolvedBindings.filter((binding) => binding.allowInInput)
        : resolvedBindings;
      let candidate = [...pending, chord];
      let result = matchPendingSequence(candidate, candidateBindings);
      if (result.type === "none" && pending.length > 0) {
        candidate = [chord];
        result = matchPendingSequence(candidate, candidateBindings);
      }
      if (result.type === "exact") {
        event.preventDefault();
        clearPending();
        registryReference.current.get(result.id)?.run();
        return;
      }
      if (result.type === "prefix") {
        event.preventDefault();
        if (pending.length > 0 && sameChordSequence(candidate, pending)) {
          clearPending();
          return;
        }
        pending = candidate;
        setIsSequencePending(true);
        if (resetTimeoutId) {
          clearTimeout(resetTimeoutId);
        }
        resetTimeoutId = setTimeout(clearPending, SEQUENCE_RESET_MS);
        return;
      }
      clearPending();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearPending();
    };
  }, [resolvedBindings]);
}
