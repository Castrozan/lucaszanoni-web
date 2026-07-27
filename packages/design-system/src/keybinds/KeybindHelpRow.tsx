import { useCallback, type RefObject } from "react";
import { cn } from "../lib/utils";
import { KeybindCaptureInput } from "./KeybindCaptureInput";
import { formatBindingForDisplay } from "./keybindDisplay";
import type { KeybindBindingView } from "./keybindViews";

export interface KeybindHelpRowProps {
  readonly binding: KeybindBindingView;
  readonly leader: string;
  readonly editing: boolean;
  readonly conflicted: boolean;
  readonly highlighted: boolean;
  readonly rebinding: boolean;
  readonly rowRef?: RefObject<HTMLLIElement | null>;
  readonly onHighlight: () => void;
  readonly onRebind: (actionId: string, binding: string) => void;
  readonly onRebindEnd: () => void;
  readonly onReset: (actionId: string) => void;
}

export function KeybindHelpRow({
  binding,
  leader,
  editing,
  conflicted,
  highlighted,
  rebinding,
  rowRef,
  onHighlight,
  onRebind,
  onRebindEnd,
  onReset,
}: KeybindHelpRowProps) {
  const handleCapture = useCallback(
    (value: string) => onRebind(binding.id, value),
    [onRebind, binding.id],
  );

  return (
    <li
      ref={rowRef}
      aria-current={highlighted ? "true" : undefined}
      onMouseEnter={onHighlight}
      className={cn(
        "flex items-center justify-between gap-4 border-b border-border/50 px-5 py-3",
        highlighted && "bg-surface-raised",
      )}
    >
      <span
        className={cn(
          "font-mono text-[13px]",
          highlighted ? "text-primary" : "text-foreground",
        )}
      >
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
        {editing || rebinding ? (
          <KeybindCaptureInput
            key={rebinding ? "armed" : "idle"}
            leader={leader}
            startCapturing={rebinding}
            onCapture={handleCapture}
            onCaptureEnd={onRebindEnd}
          />
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
