import { useCallback } from "react";
import { KeybindCaptureInput } from "./KeybindCaptureInput";
import { formatBindingForDisplay } from "./keybindDisplay";
import type { KeybindBindingView } from "./keybindViews";

export interface KeybindHelpRowProps {
  readonly binding: KeybindBindingView;
  readonly leader: string;
  readonly editing: boolean;
  readonly conflicted: boolean;
  readonly onRebind: (actionId: string, binding: string) => void;
  readonly onReset: (actionId: string) => void;
}

export function KeybindHelpRow({
  binding,
  leader,
  editing,
  conflicted,
  onRebind,
  onReset,
}: KeybindHelpRowProps) {
  const handleCapture = useCallback(
    (value: string) => onRebind(binding.id, value),
    [onRebind, binding.id],
  );

  return (
    <li className="flex items-center justify-between gap-4 border-b border-border/50 px-5 py-3">
      <span className="font-mono text-[13px] text-foreground">
        {binding.label}
        {binding.isOverridden ? (
          <span className="ml-2 text-text-faint">(custom)</span>
        ) : null}
        {conflicted ? (
          <span className="ml-2 text-accent-secondary">(conflict)</span>
        ) : null}
      </span>
      <div className="flex shrink-0 items-center gap-2">
        <kbd className="border border-border px-2 py-0.5 font-mono text-[12px] text-muted-foreground">
          {formatBindingForDisplay(binding.currentBinding, leader)}
        </kbd>
        {editing ? (
          <KeybindCaptureInput leader={leader} onCapture={handleCapture} />
        ) : null}
        {editing && binding.isOverridden ? (
          <button
            type="button"
            onClick={() => onReset(binding.id)}
            className="border border-border px-2 py-0.5 font-mono text-[11px] text-text-faint transition-colors hover:text-foreground"
          >
            Reset
          </button>
        ) : null}
      </div>
    </li>
  );
}
