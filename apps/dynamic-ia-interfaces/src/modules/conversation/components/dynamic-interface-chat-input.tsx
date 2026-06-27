"use client";

import { useRef, useEffect } from "react";

interface ChatInputProps {
  readonly inputValue: string;
  readonly onInputValueChange: (value: string) => void;
  readonly onSubmit: () => void;
  readonly isStreaming: boolean;
  readonly onStop: () => void;
}

export function DynamicInterfaceChatInput({
  inputValue,
  onInputValueChange,
  onSubmit,
  isStreaming,
  onStop,
}: ChatInputProps) {
  const textareaReference = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isStreaming && textareaReference.current) {
      textareaReference.current.focus();
    }
  }, [isStreaming]);

  function handleKeyboardSubmit(event: React.KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (isStreaming) {
        onStop();
      } else if (inputValue.trim()) {
        onSubmit();
      }
    }
  }

  return (
    <div className="border-t border-border bg-background p-4">
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <textarea
          ref={textareaReference}
          value={inputValue}
          onChange={(event) => onInputValueChange(event.target.value)}
          onKeyDown={handleKeyboardSubmit}
          placeholder="Describe the interface you need..."
          rows={1}
          className="flex-1 resize-none rounded-lg border border-border bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {isStreaming ? (
          <button
            onClick={onStop}
            className="rounded-lg bg-destructive px-4 py-3 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
          >
            Stop
          </button>
        ) : (
          <button
            onClick={onSubmit}
            disabled={!inputValue.trim()}
            className="rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            Send
          </button>
        )}
      </div>
    </div>
  );
}
