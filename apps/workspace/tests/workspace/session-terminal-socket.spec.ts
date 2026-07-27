import { afterEach, describe, expect, it, vi } from "vitest";
import {
  connectSessionTerminalWebSocket,
  encodeSessionTerminalResize,
} from "../../src/workspace/session-terminal-socket";

class FakeTerminalWebSocket {
  static latest: FakeTerminalWebSocket | null = null;

  binaryType = "";
  closed = false;
  readonly sentFrames: unknown[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onclose: ((event: { code: number; reason: string }) => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(readonly url: string) {
    FakeTerminalWebSocket.latest = this;
  }

  send(frame: unknown): void {
    this.sentFrames.push(frame);
  }

  close(): void {
    this.closed = true;
  }
}

function installFakeWebSocket() {
  FakeTerminalWebSocket.latest = null;
  vi.stubGlobal("WebSocket", FakeTerminalWebSocket);
  return () => {
    const socket = FakeTerminalWebSocket.latest;
    if (!socket) {
      throw new Error("no terminal websocket was constructed");
    }
    return socket;
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("connectSessionTerminalWebSocket", () => {
  it("reports the socket opening and decodes binary output frames", () => {
    const latestSocket = installFakeWebSocket();
    const onOpen = vi.fn();
    const onOutputBytes = vi.fn();
    connectSessionTerminalWebSocket("ws://host/session", {
      onOpen,
      onOutputBytes,
    });

    const socket = latestSocket();
    socket.onopen?.();
    socket.onmessage?.({ data: new Uint8Array([104, 105]).buffer });

    expect(onOpen).toHaveBeenCalledOnce();
    expect(onOutputBytes).toHaveBeenCalledExactlyOnceWith(
      new Uint8Array([104, 105]),
    );
  });

  it("encodes string output frames so a text-mode host still renders", () => {
    const latestSocket = installFakeWebSocket();
    const onOutputBytes = vi.fn();
    connectSessionTerminalWebSocket("ws://host/session", {
      onOpen: () => {},
      onOutputBytes,
    });

    latestSocket().onmessage?.({ data: "hi" });

    expect(onOutputBytes).toHaveBeenCalledExactlyOnceWith(
      new TextEncoder().encode("hi"),
    );
  });

  it("reports the close reason so a caller can show why the session ended", () => {
    const latestSocket = installFakeWebSocket();
    const onClose = vi.fn();
    connectSessionTerminalWebSocket("ws://host/session", {
      onOpen: () => {},
      onOutputBytes: () => {},
      onClose,
    });

    latestSocket().onclose?.({ code: 1006, reason: "host went away" });

    expect(onClose).toHaveBeenCalledExactlyOnceWith("host went away");
  });

  it("falls back to the close code when the host sends no reason", () => {
    const latestSocket = installFakeWebSocket();
    const onClose = vi.fn();
    connectSessionTerminalWebSocket("ws://host/session", {
      onOpen: () => {},
      onOutputBytes: () => {},
      onClose,
    });

    latestSocket().onclose?.({ code: 1006, reason: "" });

    expect(onClose).toHaveBeenCalledExactlyOnceWith("code 1006");
  });

  it("reports a connection error so a caller can surface it", () => {
    const latestSocket = installFakeWebSocket();
    const onError = vi.fn();
    connectSessionTerminalWebSocket("ws://host/session", {
      onOpen: () => {},
      onOutputBytes: () => {},
      onError,
    });

    latestSocket().onerror?.();

    expect(onError).toHaveBeenCalledExactlyOnceWith("connection error");
  });

  it("stays silent on close and error when the caller wants neither", () => {
    const latestSocket = installFakeWebSocket();
    connectSessionTerminalWebSocket("ws://host/session", {
      onOpen: () => {},
      onOutputBytes: () => {},
    });

    const socket = latestSocket();
    expect(() => socket.onclose?.({ code: 1000, reason: "" })).not.toThrow();
    expect(() => socket.onerror?.()).not.toThrow();
  });

  it("forwards owner keystrokes and control messages to the socket", () => {
    const latestSocket = installFakeWebSocket();
    const terminalSocket = connectSessionTerminalWebSocket(
      "ws://host/session",
      { onOpen: () => {}, onOutputBytes: () => {} },
    );

    terminalSocket.sendOwnerKeystrokes(new Uint8Array([13]));
    terminalSocket.sendControlMessage(
      encodeSessionTerminalResize({ columns: 100, rows: 30 }),
    );
    terminalSocket.close();

    const socket = latestSocket();
    expect(socket.sentFrames[0]).toEqual(new Uint8Array([13]));
    expect(socket.sentFrames[1]).toBe(
      JSON.stringify({ type: "resize", columns: 100, rows: 30 }),
    );
    expect(socket.closed).toBe(true);
  });
});
