export interface SessionTerminalWindowSize {
  readonly columns: number;
  readonly rows: number;
}

export interface SessionTerminalSocketHandlers {
  onOpen(): void;
  onOutputBytes(bytes: Uint8Array): void;
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
  return {
    sendOwnerKeystrokes: (bytes) => socket.send(bytes),
    sendControlMessage: (message) => socket.send(message),
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
