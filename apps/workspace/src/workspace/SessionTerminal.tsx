import { useEffect, useRef, useState } from "react";
import { LEADER_CAPTURE_SURFACE_ATTRIBUTE } from "@platform/design-system";
import {
  connectSessionTerminalWebSocket,
  encodeSessionTerminalResize,
  type SessionTerminalSocket,
  type SessionTerminalSocketFactory,
} from "./session-terminal-socket";
import {
  createBrowserSessionTerminalEmulator,
  type SessionTerminalEmulatorFactory,
} from "./session-terminal-emulator";
import { sessionTerminalRetryDelayMilliseconds } from "./session-terminal-retry-schedule";
import { useLiteralLeaderPrefixKeybind } from "./use-literal-leader-prefix-keybind";

export type OwnerKeystrokeSender = (bytes: Uint8Array) => void;

export interface SessionTerminalProps {
  endpoint: string;
  createSocket?: SessionTerminalSocketFactory;
  createTerminal?: SessionTerminalEmulatorFactory;
  publishOwnerKeystrokeSender?: (sender: OwnerKeystrokeSender | null) => void;
}

function browserHostCanRenderLiveTerminal(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    typeof WebSocket !== "undefined"
  );
}

export function SessionTerminal({
  endpoint,
  createSocket = connectSessionTerminalWebSocket,
  createTerminal = createBrowserSessionTerminalEmulator,
  publishOwnerKeystrokeSender,
}: SessionTerminalProps) {
  const terminalContainerRef = useRef<HTMLDivElement | null>(null);
  const activeSocketRef = useRef<SessionTerminalSocket | null>(null);
  const publishSenderRef = useRef(publishOwnerKeystrokeSender);
  publishSenderRef.current = publishOwnerKeystrokeSender;
  const [sessionConnectionLost, setSessionConnectionLost] = useState(false);
  useLiteralLeaderPrefixKeybind((bytes) =>
    activeSocketRef.current?.sendOwnerKeystrokes(bytes),
  );

  useEffect(() => {
    const container = terminalContainerRef.current;
    if (!container) {
      return;
    }
    const usesRealBrowserResources =
      createSocket === connectSessionTerminalWebSocket ||
      createTerminal === createBrowserSessionTerminalEmulator;
    if (usesRealBrowserResources && !browserHostCanRenderLiveTerminal()) {
      return;
    }

    const terminal = createTerminal();
    terminal.attachTo(container);

    let stopped = false;
    let consecutiveFailedAttempts = 0;
    let pendingRetry: ReturnType<typeof setTimeout> | null = null;
    const sendResize = () =>
      activeSocketRef.current?.sendControlMessage(
        encodeSessionTerminalResize(terminal.fitToContainer()),
      );

    const scheduleReconnect = () => {
      if (stopped || pendingRetry !== null) {
        return;
      }
      setSessionConnectionLost(true);
      consecutiveFailedAttempts += 1;
      pendingRetry = setTimeout(() => {
        pendingRetry = null;
        openSessionSocket();
      }, sessionTerminalRetryDelayMilliseconds(consecutiveFailedAttempts));
    };

    function openSessionSocket() {
      if (stopped) {
        return;
      }
      activeSocketRef.current = createSocket(endpoint, {
        onOpen: () => {
          consecutiveFailedAttempts = 0;
          setSessionConnectionLost(false);
          sendResize();
          publishSenderRef.current?.((bytes) =>
            activeSocketRef.current?.sendOwnerKeystrokes(bytes),
          );
        },
        onOutputBytes: (bytes) => terminal.writeOutputBytes(bytes),
        onClose: scheduleReconnect,
        onError: scheduleReconnect,
      });
    }

    terminal.onOwnerInput((bytes) =>
      activeSocketRef.current?.sendOwnerKeystrokes(bytes),
    );
    openSessionSocket();

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(sendResize)
        : null;
    resizeObserver?.observe(container);

    return () => {
      stopped = true;
      if (pendingRetry !== null) {
        clearTimeout(pendingRetry);
      }
      resizeObserver?.disconnect();
      activeSocketRef.current?.close();
      activeSocketRef.current = null;
      publishSenderRef.current?.(null);
      terminal.dispose();
    };
  }, [endpoint, createSocket, createTerminal]);

  return (
    <section
      aria-label="Session terminal"
      {...{ [LEADER_CAPTURE_SURFACE_ATTRIBUTE]: "" }}
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-background"
    >
      {sessionConnectionLost ? (
        <p
          role="status"
          className="m-0 border-b border-border bg-surface px-3 py-1 font-mono text-[11px] uppercase tracking-[2px] text-text-faint"
        >
          Reconnecting to the session
        </p>
      ) : null}
      <div
        ref={terminalContainerRef}
        role="log"
        aria-label="Session output"
        className="relative min-h-0 flex-1 overflow-hidden px-2 py-2"
      />
    </section>
  );
}
