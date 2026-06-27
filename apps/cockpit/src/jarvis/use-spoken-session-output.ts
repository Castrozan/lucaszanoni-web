import { useCallback, useEffect, useRef } from "react";
import { createSpokenSessionOutputTracker } from "./speakable-session-output";

export interface SpokenSessionOutputOptions {
  speak: (text: string) => void;
  enabled: boolean;
  debounceMs?: number;
}

export interface SpokenSessionOutputSink {
  ingestOutputBytes(bytes: Uint8Array): void;
}

const defaultSpeakDebounceMs = 700;

export function useSpokenSessionOutput({
  speak,
  enabled,
  debounceMs = defaultSpeakDebounceMs,
}: SpokenSessionOutputOptions): SpokenSessionOutputSink {
  const trackerRef = useRef(createSpokenSessionOutputTracker());
  const decoderRef = useRef<TextDecoder | null>(null);
  const pendingTextRef = useRef("");
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const speakRef = useRef(speak);
  speakRef.current = speak;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const flushPendingOutput = useCallback(() => {
    flushTimerRef.current = null;
    const pendingText = pendingTextRef.current;
    pendingTextRef.current = "";
    if (pendingText.length === 0 || !enabledRef.current) {
      return;
    }
    const freshLines = trackerRef.current.takeNewSpeakableLines(pendingText);
    if (freshLines.length === 0) {
      return;
    }
    speakRef.current(freshLines.join(". "));
  }, []);

  const ingestOutputBytes = useCallback(
    (bytes: Uint8Array) => {
      if (!decoderRef.current) {
        decoderRef.current = new TextDecoder();
      }
      pendingTextRef.current += decoderRef.current.decode(bytes, {
        stream: true,
      });
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
      }
      flushTimerRef.current = setTimeout(flushPendingOutput, debounceMs);
    },
    [flushPendingOutput, debounceMs],
  );

  useEffect(() => {
    return () => {
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
    };
  }, []);

  return { ingestOutputBytes };
}
