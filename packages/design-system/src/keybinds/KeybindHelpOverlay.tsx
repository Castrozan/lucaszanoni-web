import { useCallback, useEffect, useState } from "react";
import { useKeybind } from "./useKeybind";
import { useKeybindRegistry } from "./useKeybindRegistry";
import { KeybindHelpDialog } from "./KeybindHelpDialog";
import { useDismissOnEscapeKey } from "../lib/useDismissOnEscapeKey";

export function KeybindHelpOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const registry = useKeybindRegistry();

  useKeybind({
    id: "keybinds.help",
    label: "Show keyboard shortcuts",
    defaultBinding: "?",
    run: () => setIsOpen((open) => !open),
  });

  useDismissOnEscapeKey(
    isOpen,
    useCallback(() => setIsOpen(false), []),
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [isOpen]);

  if (!isOpen || !registry) {
    return null;
  }

  return (
    <div
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          setIsOpen(false);
        }
      }}
      className="fixed inset-0 z-[70] flex items-start justify-center bg-background/80 p-4 pt-[14vh]"
    >
      <KeybindHelpDialog registry={registry} />
    </div>
  );
}
