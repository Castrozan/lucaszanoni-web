import { useCallback, useEffect, useRef, useState } from "react";
import { useJarvisSessionTerminal } from "./use-jarvis-session-terminal";
import {
  createBrowserSessionTerminalEmulator,
  type SessionTerminalEmulator,
} from "@platform/workspace";
import { useJarvisSpeech } from "./use-jarvis-speech";
import { useSpokenSessionOutput } from "./use-spoken-session-output";
import { encodeSpokenSessionInput } from "./spoken-session-input";
import {
  type JarvisSessionTerminalView,
  type JarvisSessionTerminalViewOptions,
} from "./jarvis-session-terminal-view-types";

export type {
  JarvisSessionTerminalView,
  JarvisSessionTerminalViewOptions,
  JarvisSessionVoiceView,
} from "./jarvis-session-terminal-view-types";

export function useJarvisSessionTerminalView({
  endpoint,
  createSocket,
  createEmulator = createBrowserSessionTerminalEmulator,
  speechResolvers,
  speakDebounceMs,
}: JarvisSessionTerminalViewOptions): JarvisSessionTerminalView {
  const terminalContainerRef = useRef<HTMLDivElement | null>(null);
  const emulatorRef = useRef<SessionTerminalEmulator | null>(null);
  const ingestOutputBytesRef = useRef<((bytes: Uint8Array) => void) | null>(
    null,
  );

  const {
    status,
    detail,
    connect,
    disconnect,
    sendOwnerKeystrokes,
    sendWindowSize,
  } = useJarvisSessionTerminal(endpoint, {
    createSocket,
    onOutputBytes: (bytes) => {
      emulatorRef.current?.writeOutputBytes(bytes);
      ingestOutputBytesRef.current?.(bytes);
    },
  });

  const submitSpokenInput = useCallback(
    (transcript: string) => {
      const bytes = encodeSpokenSessionInput(transcript);
      if (bytes) {
        sendOwnerKeystrokes(bytes);
      }
    },
    [sendOwnerKeystrokes],
  );

  const {
    isListening,
    recognitionSupported,
    synthesisSupported,
    toggleListening,
    speak,
  } = useJarvisSpeech(submitSpokenInput, speechResolvers);

  const [spokenOutputMuted, setSpokenOutputMuted] = useState(true);
  const toggleSpokenOutput = useCallback(
    () => setSpokenOutputMuted((muted) => !muted),
    [],
  );

  const { ingestOutputBytes } = useSpokenSessionOutput({
    speak,
    enabled: !spokenOutputMuted,
    debounceMs: speakDebounceMs,
  });
  ingestOutputBytesRef.current = ingestOutputBytes;

  useEffect(() => {
    if (!endpoint) {
      return;
    }
    const canOpenSocket =
      createSocket != null || typeof WebSocket !== "undefined";
    if (!canOpenSocket) {
      return;
    }
    connect();
  }, [endpoint, createSocket, connect]);

  useEffect(() => {
    const container = terminalContainerRef.current;
    if (!container) {
      return;
    }
    const emulator = createEmulator();
    emulator.attachTo(container);
    emulator.onOwnerInput((bytes) => sendOwnerKeystrokes(bytes));
    emulatorRef.current = emulator;

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => sendWindowSize(emulator.fitToContainer()))
        : null;
    resizeObserver?.observe(container);

    return () => {
      resizeObserver?.disconnect();
      emulator.dispose();
      emulatorRef.current = null;
    };
  }, [createEmulator, sendOwnerKeystrokes, sendWindowSize]);

  useEffect(() => {
    if (status !== "open") {
      return;
    }
    const emulator = emulatorRef.current;
    if (!emulator) {
      return;
    }
    sendWindowSize(emulator.fitToContainer());
  }, [status, sendWindowSize]);
  const focusTerminal = useCallback(() => {
    emulatorRef.current?.focus();
  }, []);

  return {
    status,
    detail,
    connect,
    disconnect,
    terminalContainerRef,
    focusTerminal,
    sendOwnerKeystrokes,
    voice: {
      isListening,
      recognitionSupported,
      synthesisSupported,
      toggleListening,
      spokenOutputMuted,
      toggleSpokenOutput,
    },
  };
}
