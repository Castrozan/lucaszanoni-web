import { useEffect, useRef } from "react";

export const PALETTE_SCROLLBAR_CLASSNAME =
  "overscroll-contain [scrollbar-color:var(--ls-color-border)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--ls-color-border)] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5";

export interface PaletteScrollBehavior {
  readonly highlightedItemRef: React.RefObject<HTMLLIElement | null>;
  readonly allowPointerHighlight: () => void;
  readonly isPointerHighlightAllowed: () => boolean;
}

export function usePaletteScrollIntoView(
  highlightedIndex: number,
): PaletteScrollBehavior {
  const highlightedItemRef = useRef<HTMLLIElement | null>(null);
  const pointerHighlightSuppressedRef = useRef(false);

  useEffect(() => {
    pointerHighlightSuppressedRef.current = true;
    highlightedItemRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [highlightedIndex]);

  return {
    highlightedItemRef,
    allowPointerHighlight: () => {
      pointerHighlightSuppressedRef.current = false;
    },
    isPointerHighlightAllowed: () => !pointerHighlightSuppressedRef.current,
  };
}
