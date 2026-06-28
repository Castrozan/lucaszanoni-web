import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildCommandPaletteDestinations,
  type PaletteDestination,
} from "./commandPaletteDestinations";
import {
  COMMAND_PALETTE_OPEN_EVENT,
  navigateToHref,
  useBodyScrollLock,
} from "./commandPaletteBehavior";
import { CommandPaletteList } from "./CommandPaletteList";
import { useKeybind } from "../keybinds/useKeybind";

export { openCommandPalette } from "./commandPaletteBehavior";

const DEFAULT_COMMAND_PALETTE_DESTINATIONS = buildCommandPaletteDestinations();

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
    function handleOpenRequest() {
      setIsOpen(true);
    }
    window.addEventListener(COMMAND_PALETTE_OPEN_EVENT, handleOpenRequest);
    return () => {
      window.removeEventListener(COMMAND_PALETTE_OPEN_EVENT, handleOpenRequest);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      inputReference.current?.focus();
    }
  }, [isOpen]);

  useBodyScrollLock(isOpen);

  useKeybind({
    id: "command-palette.toggle",
    label: "Toggle command palette",
    defaultBinding: "Mod+k",
    allowInInput: true,
    run: () => setIsOpen((open) => !open),
  });
  useKeybind({
    id: "command-palette.open",
    label: "Open command palette",
    defaultBinding: "/",
    run: () => setIsOpen(true),
  });

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
        <CommandPaletteList
          destinations={matchingDestinations}
          highlightedIndex={highlightedIndex}
          onHighlight={setHighlightedIndex}
          onCommit={commitDestination}
        />
      </div>
    </div>
  );
}
