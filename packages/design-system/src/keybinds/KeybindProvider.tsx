import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { chordFromKeyboardEvent, type KeyChord } from "./keyChord";
import {
  type ResolvedKeybind,
  matchPendingSequence,
  parseBinding,
} from "./keybindResolution";
import {
  DEFAULT_LEADER_BINDING,
  type KeybindPreferenceStorage,
  loadKeybindOverrides,
  loadLeaderBinding,
} from "./keybindStore";
import {
  KeybindContext,
  type KeybindContextValue,
  type KeybindRegistration,
} from "./keybindContext";

const SEQUENCE_RESET_MS = 1500;

function activeElementAcceptsTextInput(): boolean {
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

export interface KeybindProviderProps {
  readonly children: ReactNode;
  readonly storage?: KeybindPreferenceStorage;
}

export function KeybindProvider({ children, storage }: KeybindProviderProps) {
  const preferenceStorage =
    storage ??
    (typeof window !== "undefined" ? window.localStorage : undefined);
  const registryReference = useRef(new Map<string, KeybindRegistration>());
  const [registryVersion, setRegistryVersion] = useState(0);
  const [overrides] = useState<Record<string, string>>(() =>
    preferenceStorage ? loadKeybindOverrides(preferenceStorage) : {},
  );
  const [leaderBinding] = useState<string>(() =>
    preferenceStorage
      ? loadLeaderBinding(preferenceStorage)
      : DEFAULT_LEADER_BINDING,
  );

  const register = useCallback((registration: KeybindRegistration) => {
    registryReference.current.set(registration.id, registration);
    setRegistryVersion((version) => version + 1);
    return () => {
      registryReference.current.delete(registration.id);
      setRegistryVersion((version) => version + 1);
    };
  }, []);

  const resolvedBindings = useMemo<ResolvedKeybind[]>(() => {
    void registryVersion;
    const leaderChords = parseBinding(leaderBinding, []);
    return Array.from(registryReference.current.values()).map(
      (registration) => ({
        id: registration.id,
        allowInInput: registration.allowInInput ?? false,
        chords: parseBinding(
          overrides[registration.id] ?? registration.defaultBinding,
          leaderChords,
        ),
      }),
    );
  }, [registryVersion, overrides, leaderBinding]);

  useEffect(() => {
    let pending: KeyChord[] = [];
    let resetTimeoutId: ReturnType<typeof setTimeout> | undefined;
    function clearPending() {
      pending = [];
      if (resetTimeoutId) {
        clearTimeout(resetTimeoutId);
        resetTimeoutId = undefined;
      }
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
        pending = candidate;
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

  const contextValue = useMemo<KeybindContextValue>(
    () => ({ register }),
    [register],
  );

  return (
    <KeybindContext.Provider value={contextValue}>
      {children}
    </KeybindContext.Provider>
  );
}
