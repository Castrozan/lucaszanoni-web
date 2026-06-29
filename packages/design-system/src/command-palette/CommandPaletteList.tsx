import type { PaletteDestination } from "./commandPaletteDestinations";
import {
  PALETTE_SCROLLBAR_CLASSNAME,
  usePaletteScrollIntoView,
} from "./paletteScrollBehavior";

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
  const {
    highlightedItemRef,
    allowPointerHighlight,
    isPointerHighlightAllowed,
  } = usePaletteScrollIntoView(highlightedIndex);

  return (
    <ul
      role="listbox"
      aria-label="Sections"
      onMouseMove={allowPointerHighlight}
      className={`max-h-[50vh] overflow-y-auto ${PALETTE_SCROLLBAR_CLASSNAME}`}
    >
      {destinations.length === 0 ? (
        <li className="px-4 py-3 font-mono text-[13px] text-text-faint">
          No matches
        </li>
      ) : (
        destinations.map((destination, index) => (
          <li
            key={destination.id}
            ref={index === highlightedIndex ? highlightedItemRef : null}
            role="option"
            aria-selected={index === highlightedIndex}
          >
            <button
              type="button"
              onMouseEnter={() => {
                if (isPointerHighlightAllowed()) {
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
