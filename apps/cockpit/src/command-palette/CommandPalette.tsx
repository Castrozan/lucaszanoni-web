import type { KeyboardEvent } from "react";
import { cn } from "@platform/design-system";
import type { CommandPaletteController } from "./use-command-palette";

export interface CommandPaletteProps {
  readonly controller: CommandPaletteController;
}

export function CommandPalette({ controller }: CommandPaletteProps) {
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
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 pt-[12vh]"
      onClick={controller.closePalette}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="flex w-full max-w-xl flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-2xl"
        onClick={(event) => event.stopPropagation()}
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
            className="m-0 flex max-h-[50vh] list-none flex-col overflow-y-auto p-1"
          >
            {controller.results.map((command, index) => (
              <li
                key={command.id}
                role="option"
                aria-selected={index === controller.selectedIndex}
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
