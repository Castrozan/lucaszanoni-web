import { createContext } from "react";

export interface KeybindRegistration {
  readonly id: string;
  readonly label: string;
  readonly defaultBinding: string;
  readonly run: () => void;
  readonly allowInInput?: boolean;
}

export interface KeybindContextValue {
  register(registration: KeybindRegistration): () => void;
}

export const KeybindContext = createContext<KeybindContextValue | null>(null);
