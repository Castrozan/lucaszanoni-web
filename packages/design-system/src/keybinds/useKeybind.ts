import { useContext, useEffect, useRef } from "react";
import { KeybindContext, type KeybindRegistration } from "./keybindContext";

export function useKeybind(registration: KeybindRegistration): void {
  const context = useContext(KeybindContext);
  const runReference = useRef(registration.run);
  runReference.current = registration.run;

  const { register } = context ?? {};
  const { id, label, defaultBinding, allowInInput } = registration;

  useEffect(() => {
    if (!register) {
      return;
    }
    return register({
      id,
      label,
      defaultBinding,
      allowInInput,
      run: () => runReference.current(),
    });
  }, [register, id, label, defaultBinding, allowInInput]);
}
