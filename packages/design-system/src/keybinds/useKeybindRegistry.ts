import { useContext } from "react";
import { KeybindContext, type KeybindContextValue } from "./keybindContext";

export function useKeybindRegistry(): KeybindContextValue | null {
  return useContext(KeybindContext);
}
