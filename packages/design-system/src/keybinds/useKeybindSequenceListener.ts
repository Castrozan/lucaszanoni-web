import { useEffect, type MutableRefObject } from "react";
import { chordFromKeyboardEvent, type KeyChord } from "./keyChord";
import {
  matchPendingSequence,
  type ResolvedKeybind,
} from "./keybindResolution";
import {
  activeElementAcceptsTextInput,
  activeElementCapturesLeaderSequences,
  sameChordSequence,
} from "./keybindProviderHelpers";
import type { KeybindRegistration } from "./keybindContext";

const SEQUENCE_RESET_MS = 1500;

function claimEvent(event: KeyboardEvent): void {
  event.preventDefault();
  event.stopPropagation();
}

function bindingSurvivesTextInput(binding: ResolvedKeybind): boolean {
  if (binding.allowInInput) {
    return true;
  }
  return binding.chords.length > 1 && activeElementCapturesLeaderSequences();
}

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
        ? resolvedBindings.filter((binding) =>
            bindingSurvivesTextInput(binding),
          )
        : resolvedBindings;
      let candidate = [...pending, chord];
      let result = matchPendingSequence(candidate, candidateBindings);
      if (result.type === "none" && pending.length > 0) {
        candidate = [chord];
        result = matchPendingSequence(candidate, candidateBindings);
      }
      if (result.type === "exact") {
        claimEvent(event);
        clearPending();
        registryReference.current.get(result.id)?.run();
        return;
      }
      if (result.type === "prefix") {
        claimEvent(event);
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
    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      clearPending();
    };
  }, [resolvedBindings]);
}
