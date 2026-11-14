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
    <div className="border-border bg-background border-t p-4">
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <textarea
          ref={textareaReference}
          value={inputValue}
          onChange={(event) => onInputValueChange(event.target.value)}
          onKeyDown={handleKeyboardSubmit}
          placeholder="Describe the interface you need..."
          rows={1}
          className="border-border bg-input text-foreground placeholder:text-muted-foreground focus:ring-ring flex-1 resize-none rounded-lg border px-4 py-3 text-sm focus:ring-1 focus:outline-none"
        />
        {isStreaming ? (
          <button
            onClick={onStop}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg px-4 py-3 text-sm font-medium transition-colors"
          >
            Stop
          </button>
        ) : (
          <button
            onClick={onSubmit}
            disabled={!inputValue.trim()}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-3 text-sm font-medium transition-colors disabled:opacity-50"
          >
            Send
          </button>
        )}
      </div>
    </div>
  );
}
