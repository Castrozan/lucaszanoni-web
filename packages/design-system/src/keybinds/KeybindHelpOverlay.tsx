import { useEffect, useState } from "react";
import { useKeybind } from "./useKeybind";
import { useKeybindRegistry } from "./useKeybindRegistry";
import { formatBindingForDisplay } from "./keybindDisplay";

export function KeybindHelpOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const registry = useKeybindRegistry();

  useKeybind({
    id: "keybinds.help",
    label: "Show keyboard shortcuts",
    defaultBinding: "?",
    run: () => setIsOpen((open) => !open),
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [isOpen]);

  if (!isOpen || !registry) {
    return null;
  }

  const bindingCounts = new Map<string, number>();
  for (const binding of registry.bindings) {
    bindingCounts.set(
      binding.currentBinding,
      (bindingCounts.get(binding.currentBinding) ?? 0) + 1,
    );
  }
  const sortedBindings = [...registry.bindings].sort((first, second) =>
    first.label.localeCompare(second.label),
  );

  return (
    <div
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          setIsOpen(false);
        }
      }}
      className="fixed inset-0 z-[70] flex items-start justify-center bg-background/80 p-4 pt-[14vh]"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        className="w-full max-w-[44rem] border border-border bg-surface"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="m-0 font-grotesk text-[16px] font-bold tracking-[-0.2px] text-foreground">
            KEYBOARD SHORTCUTS
          </h2>
          <span className="font-mono text-[11px] uppercase tracking-[1.5px] text-text-faint">
            LEADER {formatBindingForDisplay("Leader", registry.leader)}
          </span>
        </div>
        <ul
          role="list"
          className="max-h-[60vh] overflow-y-auto overscroll-contain [scrollbar-color:var(--ls-color-border)_transparent] [scrollbar-width:thin]"
        >
          {sortedBindings.length === 0 ? (
            <li className="px-5 py-3 font-mono text-[13px] text-text-faint">
              No shortcuts registered
            </li>
          ) : (
            sortedBindings.map((binding) => (
              <li
                key={binding.id}
                className="flex items-center justify-between gap-4 border-b border-border/50 px-5 py-3"
              >
                <span className="font-mono text-[13px] text-foreground">
                  {binding.label}
                  {binding.isOverridden ? (
                    <span className="ml-2 text-text-faint">(custom)</span>
                  ) : null}
                  {(bindingCounts.get(binding.currentBinding) ?? 0) > 1 ? (
                    <span className="ml-2 text-accent-secondary">
                      (conflict)
                    </span>
                  ) : null}
                </span>
                <kbd className="shrink-0 border border-border px-2 py-0.5 font-mono text-[12px] text-muted-foreground">
                  {formatBindingForDisplay(
                    binding.currentBinding,
                    registry.leader,
                  )}
                </kbd>
              </li>
            ))
          )}
        </ul>
        <div className="border-t border-border px-5 py-2.5 font-mono text-[11px] uppercase tracking-[1.5px] text-text-faint">
          ? to toggle · Esc to close
        </div>
      </div>
    </div>
  );
}
