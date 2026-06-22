import { useCallback, useEffect, useReducer, useRef } from "react";
import {
  encodeResizeControlMessage,
  initialJarvisTerminalState,
  reduceJarvisTerminal,
  type JarvisTerminalStatus,
  type JarvisTerminalWindowSize,
} from "./jarvis-session-terminal-model";

export interface JarvisSessionSocket {
  sendOwnerKeystrokes(bytes: Uint8Array): void;
  sendControlMessage(message: string): void;
  close(): void;
}

export interface JarvisSessionSocketHandlers {
  onOpen(): void;
  onOutputBytes(bytes: Uint8Array): void;
  onClose(reason: string): void;
  onError(message: string): void;
}

export type JarvisSessionSocketFactory = (
  endpoint: string,
  handlers: JarvisSessionSocketHandlers,
) => JarvisSessionSocket;

const stringFrameEncoder = new TextEncoder();

export const connectJarvisSessionWebSocket: JarvisSessionSocketFactory = (
  endpoint,
  handlers,
) => {
  const socket = new WebSocket(endpoint);
  socket.binaryType = "arraybuffer";
  socket.onopen = () => handlers.onOpen();
  socket.onmessage = (event) => {
    const data = event.data;
    if (data instanceof ArrayBuffer) {
      handlers.onOutputBytes(new Uint8Array(data));
    } else if (typeof data === "string") {
      handlers.onOutputBytes(stringFrameEncoder.encode(data));
    }
  };
  socket.onclose = (event) =>
    handlers.onClose(event.reason || `code ${event.code}`);
  socket.onerror = () => handlers.onError("connection error");
  return {
    sendOwnerKeystrokes: (bytes) => socket.send(bytes),
    sendControlMessage: (message) => socket.send(message),
    close: () => socket.close(),
  };
};

export interface JarvisSessionTerminalController {
  status: JarvisTerminalStatus;
  detail: string;
  connect(): void;
  disconnect(): void;
  sendOwnerKeystrokes(bytes: Uint8Array): void;
  sendWindowSize(windowSize: JarvisTerminalWindowSize): void;
}

export interface UseJarvisSessionTerminalOptions {
  createSocket?: JarvisSessionSocketFactory;
  onOutputBytes?: (bytes: Uint8Array) => void;
}

export function useJarvisSessionTerminal(
  endpoint: string | null,
  options: UseJarvisSessionTerminalOptions = {},
): JarvisSessionTerminalController {
  const { createSocket = connectJarvisSessionWebSocket, onOutputBytes } =
    options;
  const [state, dispatch] = useReducer(
    reduceJarvisTerminal,
    initialJarvisTerminalState,
  );
  const socketRef = useRef<JarvisSessionSocket | null>(null);
  const onOutputBytesRef = useRef(onOutputBytes);
  onOutputBytesRef.current = onOutputBytes;

  const connect = useCallback(() => {
    if (!endpoint || socketRef.current) {
      return;
    }
    dispatch({ type: "connecting" });
    socketRef.current = createSocket(endpoint, {
      onOpen: () => dispatch({ type: "opened" }),
      onOutputBytes: (bytes) => onOutputBytesRef.current?.(bytes),
      onClose: (reason) => {
        socketRef.current = null;
        dispatch({ type: "closed", reason });
      },
      onError: (message) => {
        socketRef.current = null;
        dispatch({ type: "errored", message });
      },
    });
  }, [endpoint, createSocket]);

  const disconnect = useCallback(() => {
    socketRef.current?.close();
    socketRef.current = null;
  }, []);

  const sendOwnerKeystrokes = useCallback((bytes: Uint8Array) => {
    if (!socketRef.current || bytes.length === 0) {
      return;
    }
    socketRef.current.sendOwnerKeystrokes(bytes);
  }, []);

  const sendWindowSize = useCallback((windowSize: JarvisTerminalWindowSize) => {
    if (!socketRef.current) {
      return;
    }
    socketRef.current.sendControlMessage(
      encodeResizeControlMessage(windowSize),
    );
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
    detail: state.detail,
    connect,
    disconnect,
    sendOwnerKeystrokes,
    sendWindowSize,
  };
}
