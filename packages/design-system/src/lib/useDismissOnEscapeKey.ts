import { useEffect } from "react";

export function useDismissOnEscapeKey(
  isOpen: boolean,
  dismiss: () => void,
): void {
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    function dismissOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        dismiss();
      }
    }
    window.addEventListener("keydown", dismissOnEscape);
    return () => {
      window.removeEventListener("keydown", dismissOnEscape);
    };
  }, [isOpen, dismiss]);
}
