import { useState, type KeyboardEvent } from "react";
import { cn } from "../lib/utils";
import {
  PALETTE_SCROLLBAR_CLASSNAME,
  usePaletteScrollIntoView,
} from "../command-palette/paletteScrollBehavior";
import { KeybindCaptureInput } from "./KeybindCaptureInput";
import { KeybindHelpRow } from "./KeybindHelpRow";
import { formatBindingForDisplay } from "./keybindDisplay";
import {
  countBindingCollisions,
  filterAndSortBindings,
} from "./keybindHelpModel";
import { useKeybindHelpNavigation } from "./useKeybindHelpNavigation";
import type { KeybindContextValue } from "./keybindContext";

export interface KeybindHelpDialogProps {
  readonly registry: KeybindContextValue;
}

export function KeybindHelpDialog({ registry }: KeybindHelpDialogProps) {
  const [editing, setEditing] = useState(false);
  const [rebindingActionId, setRebindingActionId] = useState<string | null>(
    null,
  );
  const [query, setQuery] = useState("");
  const collisionsByBinding = countBindingCollisions(registry.bindings);
  const rows = filterAndSortBindings(registry.bindings, query);
  const navigation = useKeybindHelpNavigation(rows.length);
  const {
    highlightedItemRef,
    allowPointerHighlight,
    isPointerHighlightAllowed,
  } = usePaletteScrollIntoView(navigation.highlightedIndex);

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        navigation.moveHighlight(1);
        return;
      case "ArrowUp":
        event.preventDefault();
        navigation.moveHighlight(-1);
        return;
      case "Home":
        event.preventDefault();
        navigation.highlightFirst();
        return;
      case "End":
        event.preventDefault();
        navigation.highlightLast();
        return;
      case "Enter": {
        event.preventDefault();
        const highlighted = rows[navigation.highlightedIndex];
        if (highlighted) {
          setRebindingActionId(highlighted.id);
        }
        return;
      }
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      className="flex max-h-[72vh] w-full max-w-[44rem] flex-col border border-border bg-surface"
    >
      <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-3">
        <h2 className="m-0 font-grotesk text-[16px] font-bold tracking-[-0.2px] text-foreground">
          KEYBOARD SHORTCUTS
        </h2>
        <button
          type="button"
          onClick={() => setEditing((value) => !value)}
          className="border border-border px-2 py-0.5 font-mono text-[11px] uppercase tracking-[1.5px] text-text-faint transition-colors hover:text-foreground"
        >
          {editing ? "Done" : "Edit"}
        </button>
      </div>
      <input
        type="text"
        aria-label="Search shortcuts"
        autoFocus
        value={query}
        placeholder="Filter shortcuts…"
        onChange={(event) => {
          setQuery(event.target.value);
          navigation.highlightFirst();
        }}
        onKeyDown={handleSearchKeyDown}
        className="border-b border-border bg-transparent px-5 py-3 font-mono text-[13px] text-foreground outline-none placeholder:text-text-faint"
      />
      <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-3">
        <span className="font-mono text-[13px] text-foreground">Leader</span>
        <div className="flex shrink-0 items-center gap-2">
          <kbd className="border border-border px-2 py-0.5 font-mono text-[12px] text-muted-foreground">
            {formatBindingForDisplay("Leader", registry.leader)}
          </kbd>
          {editing ? (
            <KeybindCaptureInput
              leader={registry.leader}
              onCapture={registry.setLeader}
            />
          ) : null}
        </div>
      </div>
      <ul
        role="list"
        onMouseMove={allowPointerHighlight}
        className={cn(
          "m-0 min-h-0 list-none overflow-y-auto p-0",
          PALETTE_SCROLLBAR_CLASSNAME,
        )}
      >
        {rows.length === 0 ? (
          <li className="px-5 py-3 font-mono text-[13px] text-text-faint">
            No matching shortcuts
          </li>
        ) : (
          rows.map((binding, index) => (
            <KeybindHelpRow
              key={binding.id}
              binding={binding}
              leader={registry.leader}
              editing={editing}
              conflicted={
                (collisionsByBinding.get(binding.currentBinding) ?? 0) > 1
              }
              highlighted={index === navigation.highlightedIndex}
              rebinding={binding.id === rebindingActionId}
              rowRef={
                index === navigation.highlightedIndex
                  ? highlightedItemRef
                  : undefined
              }
              onHighlight={() => {
                if (isPointerHighlightAllowed()) {
                  navigation.moveHighlight(index - navigation.highlightedIndex);
                }
              }}
              onRebind={registry.setOverride}
              onRebindEnd={() => setRebindingActionId(null)}
              onReset={registry.resetOverride}
            />
          ))
        )}
      </ul>
      <div className="border-t border-border px-5 py-2.5 font-mono text-[11px] uppercase tracking-[1.5px] text-text-faint">
        &uarr;&darr; move · Enter rebind · Esc close
      </div>
    </div>
  );
}
