export interface SessionTerminalWindowSize {
  readonly columns: number;
  readonly rows: number;
}

export interface SessionTerminalSocketHandlers {
  onOpen(): void;
  onOutputBytes(bytes: Uint8Array): void;
  onClose?(reason: string): void;
  onError?(message: string): void;
}

export interface SessionTerminalSocket {
  sendOwnerKeystrokes(bytes: Uint8Array): void;
  sendControlMessage(message: string): void;
  close(): void;
}

export type SessionTerminalSocketFactory = (
  endpoint: string,
  handlers: SessionTerminalSocketHandlers,
) => SessionTerminalSocket;

const stringFrameEncoder = new TextEncoder();

export const connectSessionTerminalWebSocket: SessionTerminalSocketFactory = (
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
    handlers.onClose?.(event.reason || `code ${event.code}`);
  socket.onerror = () => handlers.onError?.("connection error");
  const sendWhenOpen = (frame: Uint8Array | string) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(frame);
    }
  };
  return {
    sendOwnerKeystrokes: sendWhenOpen,
    sendControlMessage: sendWhenOpen,
    close: () => socket.close(),
  };
};

export function encodeSessionTerminalResize(
  windowSize: SessionTerminalWindowSize,
): string {
  return JSON.stringify({
    type: "resize",
    columns: windowSize.columns,
    rows: windowSize.rows,
  });
}
