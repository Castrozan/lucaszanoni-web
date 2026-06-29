import { type ReactNode, useCallback, useMemo, useRef, useState } from "react";
import { type ResolvedKeybind, parseBinding } from "./keybindResolution";
import { useKeybindSequenceListener } from "./useKeybindSequenceListener";
import {
  DEFAULT_LEADER_BINDING,
  type KeybindPreferenceStorage,
  loadKeybindOverrides,
  loadLeaderBinding,
  removeKeybindOverride,
  saveKeybindOverride,
  saveLeaderBinding,
} from "./keybindStore";
import { buildKeybindBindingViews } from "./keybindViews";
import {
  KeybindContext,
  type KeybindContextValue,
  type KeybindRegistration,
} from "./keybindContext";
import { KeybindSystemSurfaces } from "./KeybindSystemSurfaces";

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
  const [overrides, setOverridesState] = useState<Record<string, string>>(() =>
    preferenceStorage ? loadKeybindOverrides(preferenceStorage) : {},
  );
  const [leaderBinding, setLeaderState] = useState<string>(() =>
    preferenceStorage
      ? loadLeaderBinding(preferenceStorage)
      : DEFAULT_LEADER_BINDING,
  );
  const [isSequencePending, setIsSequencePending] = useState(false);

  const register = useCallback((registration: KeybindRegistration) => {
    registryReference.current.set(registration.id, registration);
    setRegistryVersion((version) => version + 1);
    return () => {
      registryReference.current.delete(registration.id);
      setRegistryVersion((version) => version + 1);
    };
  }, []);

  const setOverride = useCallback(
    (actionId: string, binding: string) => {
      if (preferenceStorage) {
        saveKeybindOverride(preferenceStorage, actionId, binding);
      }
      setOverridesState((current) => ({ ...current, [actionId]: binding }));
    },
    [preferenceStorage],
  );

  const resetOverride = useCallback(
    (actionId: string) => {
      if (preferenceStorage) {
        removeKeybindOverride(preferenceStorage, actionId);
      }
      setOverridesState((current) => {
        const remaining = { ...current };
        delete remaining[actionId];
        return remaining;
      });
    },
    [preferenceStorage],
  );

  const setLeader = useCallback(
    (binding: string) => {
      if (preferenceStorage) {
        saveLeaderBinding(preferenceStorage, binding);
      }
      setLeaderState(binding);
    },
    [preferenceStorage],
  );

  const bindings = useMemo(() => {
    void registryVersion;
    return buildKeybindBindingViews(
      Array.from(registryReference.current.values()),
      overrides,
    );
  }, [registryVersion, overrides]);

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

  useKeybindSequenceListener(
    resolvedBindings,
    registryReference,
    setIsSequencePending,
  );

  const contextValue = useMemo<KeybindContextValue>(
    () => ({
      register,
      bindings,
      leader: leaderBinding,
      isSequencePending,
      setOverride,
      resetOverride,
      setLeader,
    }),
    [
      register,
      bindings,
      leaderBinding,
      isSequencePending,
      setOverride,
      resetOverride,
      setLeader,
    ],
  );

  return (
    <KeybindContext.Provider value={contextValue}>
      {children}
      <KeybindSystemSurfaces />
    </KeybindContext.Provider>
  );
}
