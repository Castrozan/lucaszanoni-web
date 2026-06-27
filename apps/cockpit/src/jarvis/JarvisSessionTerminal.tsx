import { useEffect, useRef } from "react";
import { Button } from "@platform/design-system";
import { resolveJarvisSessionEndpoint } from "./jarvis-session-config";
import { type JarvisTerminalStatus } from "./jarvis-session-terminal-model";
import {
  useJarvisSessionTerminal,
  type JarvisSessionSocketFactory,
} from "./use-jarvis-session-terminal";
import {
  createBrowserTerminalEmulator,
  type JarvisTerminalEmulator,
  type JarvisTerminalEmulatorFactory,
} from "./browser-terminal-emulator";
import { SessionSwitcher } from "../sessions/SessionSwitcher";
import { SessionVoiceControl } from "./SessionVoiceControl";
import { encodeSpokenSessionInput } from "./spoken-session-input";
import type { CockpitSession } from "../sessions/session-registry";
import {
  encodeSessionListCommand,
  encodeSessionSwitchCommand,
} from "../sessions/session-commands";

const STATUS_DOT_CLASS: Record<JarvisTerminalStatus, string> = {
  idle: "bg-text-faint",
  connecting: "bg-status-caution",
  open: "bg-status-positive",
  closed: "bg-text-faint",
  error: "bg-status-negative",
};

export interface JarvisSessionTerminalProps {
  endpoint?: string | null;
  createSocket?: JarvisSessionSocketFactory;
  createEmulator?: JarvisTerminalEmulatorFactory;
  sessions?: readonly CockpitSession[];
  activeSessionKey?: string | null;
  onSelectSession?: (key: string) => void;
  onListSessions?: () => void;
}

export function JarvisSessionTerminal({
  endpoint = resolveJarvisSessionEndpoint(),
  createSocket,
  createEmulator = createBrowserTerminalEmulator,
  sessions = [],
  activeSessionKey = null,
  onSelectSession,
  onListSessions,
}: JarvisSessionTerminalProps) {
  const terminalContainerRef = useRef<HTMLDivElement | null>(null);
  const emulatorRef = useRef<JarvisTerminalEmulator | null>(null);

  const {
    status,
    detail,
    connect,
    disconnect,
    sendOwnerKeystrokes,
    sendWindowSize,
  } = useJarvisSessionTerminal(endpoint ?? null, {
    createSocket,
    onOutputBytes: (bytes) => emulatorRef.current?.writeOutputBytes(bytes),
  });

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

  if (!endpoint) {
    return (
      <section
        aria-label="Jarvis session terminal"
        className="flex flex-1 flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border border-border bg-background px-6 text-center"
      >
        <p className="m-0 font-mono text-xs uppercase tracking-[2px] text-text-faint">
          local session endpoint not configured
        </p>
        <p className="m-0 max-w-[46ch] font-mono text-[11px] leading-[1.6] text-muted-foreground">
          Set VITE_JARVIS_SESSION_WS_URL to the local Jarvis agent websocket to
          stream the session here.
        </p>
      </section>
    );
  }

  const isOpen = status === "open";

  const submitSpokenInput = (transcript: string) => {
    const bytes = encodeSpokenSessionInput(transcript);
    if (bytes) {
      sendOwnerKeystrokes(bytes);
    }
  };

  const selectSession = (key: string) => {
    sendOwnerKeystrokes(encodeSessionSwitchCommand(key));
    onSelectSession?.(key);
  };

  const requestSessionList = () => {
    sendOwnerKeystrokes(encodeSessionListCommand());
    onListSessions?.();
  };

  return (
    <section
      aria-label="Jarvis session terminal"
      className="flex flex-1 flex-col overflow-hidden rounded-lg border border-border bg-background"
    >
      <SessionSwitcher
        sessions={sessions}
        activeKey={activeSessionKey}
        onSelect={selectSession}
        onListSessions={requestSessionList}
      />
      <SessionVoiceControl onSpokenInput={submitSpokenInput} />
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-2">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className={`h-2 w-2 rounded-full ${STATUS_DOT_CLASS[status]}`}
          />
          <span
            title={detail}
            className="font-mono text-[11px] uppercase tracking-[2px] text-text-faint"
          >
            {status}
          </span>
        </div>
        {isOpen ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={disconnect}
          >
            Disconnect
          </Button>
        ) : (
          <Button type="button" size="sm" onClick={connect}>
            Connect
          </Button>
        )}
      </header>
      <div
        ref={terminalContainerRef}
        role="log"
        aria-label="Jarvis session output"
        className="relative flex-1 overflow-hidden px-2 py-2"
      />
    </section>
  );
}
