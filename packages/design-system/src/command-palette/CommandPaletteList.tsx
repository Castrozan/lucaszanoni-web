import { useEffect, useRef } from "react";
import type { PaletteDestination } from "./commandPaletteDestinations";

export interface CommandPaletteListProps {
  readonly destinations: readonly PaletteDestination[];
  readonly highlightedIndex: number;
  readonly onHighlight: (index: number) => void;
  readonly onCommit: (destination: PaletteDestination) => void;
}

export function CommandPaletteList({
  destinations,
  highlightedIndex,
  onHighlight,
  onCommit,
}: CommandPaletteListProps) {
  const highlightedItemReference = useRef<HTMLLIElement>(null);
  const pointerHighlightSuppressedReference = useRef(false);

  useEffect(() => {
    pointerHighlightSuppressedReference.current = true;
    highlightedItemReference.current?.scrollIntoView?.({ block: "nearest" });
  }, [highlightedIndex]);

  return (
    <ul
      role="listbox"
      aria-label="Sections"
      onMouseMove={() => {
        pointerHighlightSuppressedReference.current = false;
      }}
      className="max-h-[50vh] overflow-y-auto overscroll-contain [scrollbar-color:var(--ls-color-border)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--ls-color-border)] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5"
    >
      {destinations.length === 0 ? (
        <li className="px-4 py-3 font-mono text-[13px] text-text-faint">
          No matches
        </li>
      ) : (
        destinations.map((destination, index) => (
          <li
            key={destination.id}
            ref={index === highlightedIndex ? highlightedItemReference : null}
            role="option"
            aria-selected={index === highlightedIndex}
          >
            <button
              type="button"
              onMouseEnter={() => {
                if (!pointerHighlightSuppressedReference.current) {
                  onHighlight(index);
                }
              }}
              onClick={() => onCommit(destination)}
              data-highlighted={index === highlightedIndex ? "true" : "false"}
              className={
                "flex w-full items-center justify-between px-4 py-3 text-left font-mono text-[13px] transition-colors " +
                (index === highlightedIndex
                  ? "bg-surface-raised text-foreground"
                  : "text-muted-foreground")
              }
            >
              <span>{destination.label}</span>
              <span className="text-text-faint">{destination.href}</span>
            </button>
          </li>
        ))
      )}
    </ul>
  );
}
