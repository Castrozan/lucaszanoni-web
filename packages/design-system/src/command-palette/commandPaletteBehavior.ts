import { useEffect } from "react";

export const COMMAND_PALETTE_OPEN_EVENT = "atrium:command-palette";

export function openCommandPalette(): void {
  window.dispatchEvent(new Event(COMMAND_PALETTE_OPEN_EVENT));
}

export function navigateToHref(href: string): void {
  window.location.assign(href);
}

export function activeElementAcceptsTextInput(): boolean {
  const activeElement = document.activeElement as HTMLElement | null;
  if (!activeElement) {
    return false;
  }
  return (
    activeElement.tagName === "INPUT" ||
    activeElement.tagName === "TEXTAREA" ||
    activeElement.isContentEditable
  );
}

export function useBodyScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (!isLocked) {
      return;
    }
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [isLocked]);
}
