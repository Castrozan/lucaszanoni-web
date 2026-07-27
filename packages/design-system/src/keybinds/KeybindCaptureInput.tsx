import { useEffect, useRef, useState } from "react";
import {
  appendCapturedToken,
  buildBindingTokenFromEvent,
  capturedTokensToBinding,
} from "./keybindCapture";
import { formatBindingForDisplay } from "./keybindDisplay";

export interface KeybindCaptureInputProps {
  readonly leader: string;
  readonly onCapture: (binding: string) => void;
  readonly startCapturing?: boolean;
  readonly onCaptureEnd?: () => void;
}

export function KeybindCaptureInput({
  leader,
  onCapture,
  startCapturing = false,
  onCaptureEnd,
}: KeybindCaptureInputProps) {
  const [isCapturing, setIsCapturing] = useState(startCapturing);
  const [capturedTokens, setCapturedTokens] = useState<string[]>([]);
  const capturedTokensReference = useRef<string[]>([]);
  capturedTokensReference.current = capturedTokens;

  useEffect(() => {
    if (!isCapturing) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.key === "Escape") {
        setIsCapturing(false);
        setCapturedTokens([]);
        onCaptureEnd?.();
        return;
      }
      if (event.key === "Enter") {
        const binding = capturedTokensToBinding(
          capturedTokensReference.current,
        );
        setIsCapturing(false);
        setCapturedTokens([]);
        if (binding.length > 0) {
          onCapture(binding);
        }
        onCaptureEnd?.();
        return;
      }
      const token = buildBindingTokenFromEvent(event);
      if (token) {
        setCapturedTokens((current) => appendCapturedToken(current, token));
      }
    }
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isCapturing, onCapture, onCaptureEnd]);

  if (isCapturing) {
    const preview = capturedTokensToBinding(capturedTokens);
    return (
      <button
        type="button"
        onClick={() => {
          setIsCapturing(false);
          setCapturedTokens([]);
          onCaptureEnd?.();
        }}
        className="border border-primary px-2 py-0.5 font-mono text-[11px] text-primary"
      >
        {preview ? formatBindingForDisplay(preview, leader) : "press keys…"} ·
        Enter/Esc
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={() => {
        setCapturedTokens([]);
        setIsCapturing(true);
      }}
      className="border border-border px-2 py-0.5 font-mono text-[11px] text-text-faint transition-colors hover:text-foreground"
    >
      Rebind
    </button>
  );
}
