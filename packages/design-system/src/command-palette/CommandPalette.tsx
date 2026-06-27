import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildCommandPaletteDestinations,
  type PaletteDestination,
} from "./commandPaletteDestinations";

const COMMAND_PALETTE_OPEN_EVENT = "atrium:command-palette";

const DEFAULT_COMMAND_PALETTE_DESTINATIONS = buildCommandPaletteDestinations();

export function openCommandPalette(): void {
  window.dispatchEvent(new Event(COMMAND_PALETTE_OPEN_EVENT));
}

function navigateToHref(href: string): void {
  window.location.assign(href);
}

function activeElementAcceptsTextInput(): boolean {
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

export interface CommandPaletteProps {
  readonly destinations?: readonly PaletteDestination[];
  readonly navigate?: (href: string) => void;
}

export function CommandPalette({
  destinations = DEFAULT_COMMAND_PALETTE_DESTINATIONS,
  navigate = navigateToHref,
}: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputReference = useRef<HTMLInputElement>(null);

  const matchingDestinations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return destinations;
    }
    return destinations.filter((destination) =>
      `${destination.label} ${destination.href}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [destinations, query]);

  const closePalette = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setHighlightedIndex(0);
  }, []);

  useEffect(() => {
    function handleGlobalKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsOpen((open) => !open);
        return;
      }
      if (event.key === "/" && !isOpen && !activeElementAcceptsTextInput()) {
        event.preventDefault();
        setIsOpen(true);
      }
    }
    function handleOpenRequest() {
      setIsOpen(true);
    }
    window.addEventListener("keydown", handleGlobalKeyDown);
    window.addEventListener(COMMAND_PALETTE_OPEN_EVENT, handleOpenRequest);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
      window.removeEventListener(COMMAND_PALETTE_OPEN_EVENT, handleOpenRequest);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      inputReference.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query]);

  if (!isOpen) {
    return null;
  }

  function commitDestination(destination: PaletteDestination) {
    closePalette();
    navigate(destination.href);
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closePalette();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((index) =>
        Math.min(index + 1, Math.max(matchingDestinations.length - 1, 0)),
      );
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((index) => Math.max(index - 1, 0));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const destination = matchingDestinations[highlightedIndex];
      if (destination) {
        commitDestination(destination);
      }
    }
  }

  return (
    <div
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          closePalette();
        }
      }}
      className="fixed inset-0 z-[60] flex items-start justify-center bg-background/80 p-4 pt-[18vh]"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="w-full max-w-[40rem] border border-border bg-surface"
      >
        <input
          ref={inputReference}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder="Jump to a section, page, or app…"
          aria-label="Search sections"
          className="w-full border-b border-border bg-transparent px-4 py-3 font-mono text-[14px] text-foreground outline-none placeholder:text-text-faint"
        />
        <ul
          role="listbox"
          aria-label="Sections"
          className="max-h-[50vh] overflow-y-auto"
        >
          {matchingDestinations.length === 0 ? (
            <li className="px-4 py-3 font-mono text-[13px] text-text-faint">
              No matches
            </li>
          ) : (
            matchingDestinations.map((destination, index) => (
              <li
                key={destination.id}
                role="option"
                aria-selected={index === highlightedIndex}
              >
                <button
                  type="button"
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => commitDestination(destination)}
                  data-highlighted={
                    index === highlightedIndex ? "true" : "false"
                  }
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
      </div>
    </div>
  );
}
