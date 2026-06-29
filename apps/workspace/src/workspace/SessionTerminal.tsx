import { useEffect, useRef } from "react";
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

export interface SessionTerminalProps {
  endpoint: string;
  createSocket?: SessionTerminalSocketFactory;
  createTerminal?: SessionTerminalEmulatorFactory;
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
}: SessionTerminalProps) {
  const terminalContainerRef = useRef<HTMLDivElement | null>(null);

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

    let activeSocket: SessionTerminalSocket | null = null;
    const sendResize = () =>
      activeSocket?.sendControlMessage(
        encodeSessionTerminalResize(terminal.fitToContainer()),
      );

    activeSocket = createSocket(endpoint, {
      onOpen: () => sendResize(),
      onOutputBytes: (bytes) => terminal.writeOutputBytes(bytes),
    });
    terminal.onOwnerInput((bytes) => activeSocket?.sendOwnerKeystrokes(bytes));

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(sendResize)
        : null;
    resizeObserver?.observe(container);

    return () => {
      resizeObserver?.disconnect();
      activeSocket?.close();
      activeSocket = null;
      terminal.dispose();
    };
  }, [endpoint, createSocket, createTerminal]);

  return (
    <section
      aria-label="Session terminal"
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-background"
    >
      <div
        ref={terminalContainerRef}
        role="log"
        aria-label="Session output"
        className="relative min-h-0 flex-1 overflow-hidden px-2 py-2"
      />
    </section>
  );
}
