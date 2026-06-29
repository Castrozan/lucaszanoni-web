import { createContext } from "react";
import type { KeybindBindingView } from "./keybindViews";

export interface KeybindRegistration {
  readonly id: string;
  readonly label: string;
  readonly defaultBinding: string;
  readonly run: () => void;
  readonly allowInInput?: boolean;
}

export interface KeybindContextValue {
  register(registration: KeybindRegistration): () => void;
  readonly bindings: readonly KeybindBindingView[];
  readonly leader: string;
  readonly isSequencePending: boolean;
  setOverride(actionId: string, binding: string): void;
  resetOverride(actionId: string): void;
  setLeader(binding: string): void;
}

export const KeybindContext = createContext<KeybindContextValue | null>(null);
