import { useEffect, useMemo, type KeyboardEvent } from "react";
import { cn } from "../lib/utils";
import type { PaletteDestination } from "./commandPaletteDestinations";
import {
  buildCommandPaletteDestinations,
  destinationsToCommands,
} from "./commandPaletteDestinations";
import {
  COMMAND_PALETTE_OPEN_EVENT,
  navigateToHref,
  useBodyScrollLock,
} from "./commandPaletteBehavior";
import {
  PALETTE_SCROLLBAR_CLASSNAME,
  usePaletteScrollIntoView,
} from "./paletteScrollBehavior";
import {
  useCommandPalette,
  type CommandPaletteController,
  type PaletteCommand,
} from "./useCommandPalette";
import { useKeybind } from "../keybinds/useKeybind";

export { openCommandPalette } from "./commandPaletteBehavior";

export interface CommandPaletteProps {
  readonly controller?: CommandPaletteController;
  readonly commands?: readonly PaletteCommand[];
  readonly destinations?: readonly PaletteDestination[];
  readonly navigate?: (href: string) => void;
}

export function CommandPalette({
  controller: externalController,
  commands,
  destinations,
  navigate = navigateToHref,
}: CommandPaletteProps) {
  const resolvedCommands = useMemo(
    () =>
      externalController
        ? []
        : (commands ??
          destinationsToCommands(
            destinations ?? buildCommandPaletteDestinations(),
            navigate,
          )),
    [externalController, commands, destinations, navigate],
  );
  const selfController = useCommandPalette(resolvedCommands);
  const controller = externalController ?? selfController;

  useKeybind({
    id: "command-palette.toggle",
    label: "Toggle command palette",
    defaultBinding: "Mod+k",
    allowInInput: true,
    run: () =>
      controller.open ? controller.closePalette() : controller.openPalette(),
  });
  useKeybind({
    id: "command-palette.open",
    label: "Open command palette",
    defaultBinding: "/",
    run: () => controller.openPalette(),
  });

  useEffect(() => {
    function handleOpenRequest() {
      controller.openPalette();
    }
    window.addEventListener(COMMAND_PALETTE_OPEN_EVENT, handleOpenRequest);
    return () => {
      window.removeEventListener(COMMAND_PALETTE_OPEN_EVENT, handleOpenRequest);
    };
  }, [controller]);

  const {
    highlightedItemRef,
    allowPointerHighlight,
    isPointerHighlightAllowed,
  } = usePaletteScrollIntoView(controller.selectedIndex);

  useBodyScrollLock(controller.open);

  if (!controller.open) {
    return null;
  }

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        controller.moveSelection(1);
        return;
      case "ArrowUp":
        event.preventDefault();
        controller.moveSelection(-1);
        return;
      case "Enter":
        event.preventDefault();
        controller.runSelected();
        return;
      case "Escape":
        event.preventDefault();
        controller.closePalette();
        return;
    }
  };

  return (
    <div
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          controller.closePalette();
        }
      }}
      className="fixed inset-0 z-[60] flex items-start justify-center bg-background/80 p-4 pt-[18vh]"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="flex w-full max-w-[40rem] flex-col overflow-hidden border border-border bg-surface"
      >
        <input
          type="text"
          aria-label="Search commands"
          autoFocus
          value={controller.query}
          placeholder="Type a command…"
          onChange={(event) => controller.setQuery(event.target.value)}
          onKeyDown={onInputKeyDown}
          className="border-b border-border bg-transparent px-4 py-3 font-mono text-sm text-foreground outline-none placeholder:text-text-faint"
        />
        {controller.results.length === 0 ? (
          <p className="m-0 px-4 py-6 text-center font-mono text-xs uppercase tracking-[2px] text-text-faint">
            No matching commands
          </p>
        ) : (
          <ul
            role="listbox"
            aria-label="Command results"
            onMouseMove={allowPointerHighlight}
            className={cn(
              "m-0 flex max-h-[50vh] list-none flex-col overflow-y-auto p-1",
              PALETTE_SCROLLBAR_CLASSNAME,
            )}
          >
            {controller.results.map((command, index) => (
              <li
                key={command.id}
                ref={
                  index === controller.selectedIndex ? highlightedItemRef : null
                }
                role="option"
                aria-selected={index === controller.selectedIndex}
                onMouseEnter={() => {
                  if (isPointerHighlightAllowed()) {
                    controller.moveSelection(index - controller.selectedIndex);
                  }
                }}
                onClick={() => controller.runCommand(command.id)}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-4 rounded-md px-3 py-2 text-sm text-muted-foreground",
                  index === controller.selectedIndex &&
                    "bg-surface-raised text-primary",
                )}
              >
                <span className="font-mono">{command.title}</span>
                {command.hint ? (
                  <span className="font-mono text-[11px] text-text-faint">
                    {command.hint}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
