import { useCallback, useEffect, useReducer, useRef } from "react";
import {
  initialJarvisTerminalState,
  reduceJarvisTerminal,
  type JarvisTerminalLine,
  type JarvisTerminalStatus,
} from "./jarvis-session-terminal-model";

export interface JarvisSessionSocket {
  send(payload: string): void;
  close(): void;
}

export interface JarvisSessionSocketHandlers {
  onOpen(): void;
  onMessage(data: string): void;
  onClose(reason: string): void;
  onError(message: string): void;
}

export type JarvisSessionSocketFactory = (
  endpoint: string,
  handlers: JarvisSessionSocketHandlers,
) => JarvisSessionSocket;

export const connectJarvisSessionWebSocket: JarvisSessionSocketFactory = (
  endpoint,
  handlers,
) => {
  const socket = new WebSocket(endpoint);
  socket.onopen = () => handlers.onOpen();
  socket.onmessage = (event) =>
    handlers.onMessage(typeof event.data === "string" ? event.data : "");
  socket.onclose = (event) =>
    handlers.onClose(event.reason || `code ${event.code}`);
  socket.onerror = () => handlers.onError("connection error");
  return {
    send: (payload) => socket.send(payload),
    close: () => socket.close(),
  };
};

export interface JarvisSessionTerminalController {
  status: JarvisTerminalStatus;
  lines: readonly JarvisTerminalLine[];
  pendingOutput: string;
  isConnectable: boolean;
  connect(): void;
  disconnect(): void;
  sendInput(text: string): void;
}

export function useJarvisSessionTerminal(
  endpoint: string | null,
  createSocket: JarvisSessionSocketFactory = connectJarvisSessionWebSocket,
): JarvisSessionTerminalController {
  const [state, dispatch] = useReducer(
    reduceJarvisTerminal,
    initialJarvisTerminalState,
  );
  const socketRef = useRef<JarvisSessionSocket | null>(null);

  const connect = useCallback(() => {
    if (!endpoint || socketRef.current) {
      return;
    }
    dispatch({ type: "connecting" });
    socketRef.current = createSocket(endpoint, {
      onOpen: () => dispatch({ type: "opened" }),
      onMessage: (data) => dispatch({ type: "output", chunk: data }),
      onClose: (reason) => {
        socketRef.current = null;
        dispatch({ type: "closed", reason });
      },
      onError: (message) => dispatch({ type: "errored", message }),
    });
  }, [endpoint, createSocket]);

  const disconnect = useCallback(() => {
    socketRef.current?.close();
    socketRef.current = null;
  }, []);

  const sendInput = useCallback((text: string) => {
    if (!socketRef.current || text.length === 0) {
      return;
    }
    socketRef.current.send(`${text}\n`);
    dispatch({ type: "owner-input", text });
  }, []);

  useEffect(
    () => () => {
      socketRef.current?.close();
      socketRef.current = null;
    },
    [],
  );

  return {
    status: state.status,
    lines: state.lines,
    pendingOutput: state.pendingOutput,
    isConnectable: Boolean(endpoint),
    connect,
    disconnect,
    sendInput,
  };
}
