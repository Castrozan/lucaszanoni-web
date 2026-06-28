import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  useJarvisSessionTerminal,
  type JarvisSessionSocketFactory,
} from "./use-jarvis-session-terminal";
import {
  createBrowserTerminalEmulator,
  type JarvisTerminalEmulator,
  type JarvisTerminalEmulatorFactory,
} from "./browser-terminal-emulator";
import {
  useJarvisSpeech,
  type JarvisSpeechResolvers,
} from "./use-jarvis-speech";
import { useSpokenSessionOutput } from "./use-spoken-session-output";
import { encodeSpokenSessionInput } from "./spoken-session-input";
import {
  encodeSessionListCommand,
  encodeSessionSwitchCommand,
} from "../sessions/session-commands";
import { type JarvisTerminalStatus } from "./jarvis-session-terminal-model";

export interface JarvisSessionTerminalViewOptions {
  endpoint: string | null;
  createSocket?: JarvisSessionSocketFactory;
  createEmulator?: JarvisTerminalEmulatorFactory;
  onSelectSession?: (key: string) => void;
  onListSessions?: () => void;
  speechResolvers?: JarvisSpeechResolvers;
  speakDebounceMs?: number;
}

export interface JarvisSessionVoiceView {
  isListening: boolean;
  recognitionSupported: boolean;
  synthesisSupported: boolean;
  toggleListening: () => void;
  spokenOutputMuted: boolean;
  toggleSpokenOutput: () => void;
}

export interface JarvisSessionTerminalView {
  status: JarvisTerminalStatus;
  detail: string;
  connect: () => void;
  disconnect: () => void;
  terminalContainerRef: RefObject<HTMLDivElement | null>;
  voice: JarvisSessionVoiceView;
  selectSession: (key: string) => void;
  requestSessionList: () => void;
}

export function useJarvisSessionTerminalView({
  endpoint,
  createSocket,
  createEmulator = createBrowserTerminalEmulator,
  onSelectSession,
  onListSessions,
  speechResolvers,
  speakDebounceMs,
}: JarvisSessionTerminalViewOptions): JarvisSessionTerminalView {
  const terminalContainerRef = useRef<HTMLDivElement | null>(null);
  const emulatorRef = useRef<JarvisTerminalEmulator | null>(null);
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
    emulator.focus();
  }, [status, sendWindowSize]);

  const selectSession = useCallback(
    (key: string) => {
      sendOwnerKeystrokes(encodeSessionSwitchCommand(key));
      onSelectSession?.(key);
    },
    [sendOwnerKeystrokes, onSelectSession],
  );

  const requestSessionList = useCallback(() => {
    sendOwnerKeystrokes(encodeSessionListCommand());
    onListSessions?.();
  }, [sendOwnerKeystrokes, onListSessions]);

  return {
    status,
    detail,
    connect,
    disconnect,
    terminalContainerRef,
    voice: {
      isListening,
      recognitionSupported,
      synthesisSupported,
      toggleListening,
      spokenOutputMuted,
      toggleSpokenOutput,
    },
    selectSession,
    requestSessionList,
  };
}
