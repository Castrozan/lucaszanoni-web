import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import {
  useJarvisSessionTerminal,
  type JarvisSessionSocket,
  type JarvisSessionSocketFactory,
  type JarvisSessionSocketHandlers,
} from "../src/jarvis/use-jarvis-session-terminal";

afterEach(cleanup);

interface FakeSocketControl {
  factory: JarvisSessionSocketFactory;
  constructions: number;
  handlers: JarvisSessionSocketHandlers | null;
  ownerKeystrokeFrames: Uint8Array[];
  controlMessages: string[];
  closeCount: number;
}

function createFakeSocketControl(): FakeSocketControl {
  const control: FakeSocketControl = {
    constructions: 0,
    handlers: null,
    ownerKeystrokeFrames: [],
    controlMessages: [],
    closeCount: 0,
    factory: (_endpoint, handlers) => {
      control.constructions += 1;
      control.handlers = handlers;
      const socket: JarvisSessionSocket = {
        sendOwnerKeystrokes: (bytes) =>
          control.ownerKeystrokeFrames.push(bytes),
        sendControlMessage: (message) => control.controlMessages.push(message),
        close: () => {
          control.closeCount += 1;
        },
      };
      return socket;
    },
  };
  return control;
}

const textEncoder = new TextEncoder();
const liveEndpoint = "ws://localhost:9999/session";

describe("useJarvisSessionTerminal guards", () => {
  it("opens no socket and stays idle when connect runs without an endpoint", () => {
    const socket = createFakeSocketControl();
    const { result } = renderHook(() =>
      useJarvisSessionTerminal(null, { createSocket: socket.factory }),
    );

    act(() => result.current.connect());

    expect(socket.constructions).toBe(0);
    expect(result.current.status).toBe("idle");
  });

  it("opens exactly one session socket even when connect fires twice", () => {
    const socket = createFakeSocketControl();
    const { result } = renderHook(() =>
      useJarvisSessionTerminal(liveEndpoint, { createSocket: socket.factory }),
    );

    act(() => result.current.connect());
    act(() => result.current.connect());

    expect(socket.constructions).toBe(1);
  });

  it("drops owner keystrokes when no session socket is open", () => {
    const socket = createFakeSocketControl();
    const { result } = renderHook(() =>
      useJarvisSessionTerminal(liveEndpoint, { createSocket: socket.factory }),
    );

    act(() => result.current.sendOwnerKeystrokes(textEncoder.encode("l")));

    expect(socket.ownerKeystrokeFrames).toHaveLength(0);
  });

  it("drops empty owner keystroke frames once the session is open", () => {
    const socket = createFakeSocketControl();
    const { result } = renderHook(() =>
      useJarvisSessionTerminal(liveEndpoint, { createSocket: socket.factory }),
    );

    act(() => result.current.connect());
    act(() => socket.handlers?.onOpen());
    act(() => result.current.sendOwnerKeystrokes(new Uint8Array(0)));

    expect(socket.ownerKeystrokeFrames).toHaveLength(0);
  });

  it("drops a resize control frame when no session socket is open", () => {
    const socket = createFakeSocketControl();
    const { result } = renderHook(() =>
      useJarvisSessionTerminal(liveEndpoint, { createSocket: socket.factory }),
    );

    act(() => result.current.sendWindowSize({ columns: 80, rows: 24 }));

    expect(socket.controlMessages).toHaveLength(0);
  });

  it("forwards owner keystrokes as a binary frame once the session is open", () => {
    const socket = createFakeSocketControl();
    const { result } = renderHook(() =>
      useJarvisSessionTerminal(liveEndpoint, { createSocket: socket.factory }),
    );

    act(() => result.current.connect());
    act(() => socket.handlers?.onOpen());
    act(() => result.current.sendOwnerKeystrokes(textEncoder.encode("l")));

    expect(socket.ownerKeystrokeFrames).toHaveLength(1);
  });

  it("closes the session socket when the cockpit unmounts the terminal", () => {
    const socket = createFakeSocketControl();
    const { result, unmount } = renderHook(() =>
      useJarvisSessionTerminal(liveEndpoint, { createSocket: socket.factory }),
    );

    act(() => result.current.connect());
    unmount();

    expect(socket.closeCount).toBe(1);
  });
});
