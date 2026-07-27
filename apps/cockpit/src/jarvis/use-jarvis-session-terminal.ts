import { useCallback, useEffect, useReducer, useRef } from "react";
import {
  connectSessionTerminalWebSocket,
  encodeSessionTerminalResize,
  type SessionTerminalSocket,
  type SessionTerminalSocketFactory,
  type SessionTerminalWindowSize,
} from "@platform/workspace";
import {
  initialJarvisTerminalState,
  reduceJarvisTerminal,
  type JarvisTerminalStatus,
} from "./jarvis-session-terminal-model";

export interface JarvisSessionTerminalController {
  status: JarvisTerminalStatus;
  detail: string;
  connect(): void;
  disconnect(): void;
  sendOwnerKeystrokes(bytes: Uint8Array): void;
  sendWindowSize(windowSize: SessionTerminalWindowSize): void;
}

export interface UseJarvisSessionTerminalOptions {
  createSocket?: SessionTerminalSocketFactory;
  onOutputBytes?: (bytes: Uint8Array) => void;
}

export function useJarvisSessionTerminal(
  endpoint: string | null,
  options: UseJarvisSessionTerminalOptions = {},
): JarvisSessionTerminalController {
  const { createSocket = connectSessionTerminalWebSocket, onOutputBytes } =
    options;
  const [state, dispatch] = useReducer(
    reduceJarvisTerminal,
    initialJarvisTerminalState,
  );
  const socketRef = useRef<SessionTerminalSocket | null>(null);
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

  const sendWindowSize = useCallback(
    (windowSize: SessionTerminalWindowSize) => {
      if (!socketRef.current) {
        return;
      }
      socketRef.current.sendControlMessage(
        encodeSessionTerminalResize(windowSize),
      );
    },
    [],
  );

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
