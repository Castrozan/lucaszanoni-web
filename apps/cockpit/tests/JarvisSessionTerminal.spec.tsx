import { afterEach, describe, expect, it } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { JarvisSessionTerminal } from "../src/jarvis/JarvisSessionTerminal";
import type {
  JarvisSessionSocket,
  JarvisSessionSocketFactory,
  JarvisSessionSocketHandlers,
} from "../src/jarvis/use-jarvis-session-terminal";
import type {
  JarvisTerminalEmulator,
  JarvisTerminalEmulatorFactory,
} from "../src/jarvis/browser-terminal-emulator";

afterEach(cleanup);

interface FakeSocketControl {
  factory: JarvisSessionSocketFactory;
  handlers: JarvisSessionSocketHandlers | null;
  ownerKeystrokeFrames: Uint8Array[];
  controlMessages: string[];
  closed: boolean;
}

function createFakeSocketControl(): FakeSocketControl {
  const control: FakeSocketControl = {
    handlers: null,
    ownerKeystrokeFrames: [],
    controlMessages: [],
    closed: false,
    factory: (_endpoint, handlers) => {
      control.handlers = handlers;
      const socket: JarvisSessionSocket = {
        sendOwnerKeystrokes: (bytes) =>
          control.ownerKeystrokeFrames.push(bytes),
        sendControlMessage: (message) => control.controlMessages.push(message),
        close: () => {
          control.closed = true;
          handlers.onClose("closed by client");
        },
      };
      return socket;
    },
  };
  return control;
}

interface FakeEmulatorControl {
  factory: JarvisTerminalEmulatorFactory;
  writtenOutput: Uint8Array[];
  ownerInputHandler: ((bytes: Uint8Array) => void) | null;
  windowSize: { columns: number; rows: number };
  disposed: boolean;
}

function createFakeEmulatorControl(): FakeEmulatorControl {
  const control: FakeEmulatorControl = {
    writtenOutput: [],
    ownerInputHandler: null,
    windowSize: { columns: 100, rows: 30 },
    disposed: false,
    factory: () => {
      const emulator: JarvisTerminalEmulator = {
        attachTo: () => control.windowSize,
        writeOutputBytes: (bytes) => control.writtenOutput.push(bytes),
        onOwnerInput: (handler) => {
          control.ownerInputHandler = handler;
        },
        fitToContainer: () => control.windowSize,
        focus: () => {},
        dispose: () => {
          control.disposed = true;
        },
      };
      return emulator;
    },
  };
  return control;
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

describe("JarvisSessionTerminal", () => {
  it("shows a configuration notice and no connect control without an endpoint", () => {
    render(<JarvisSessionTerminal endpoint={null} />);
    expect(screen.getByText(/VITE_JARVIS_SESSION_WS_URL/)).toBeDefined();
    expect(screen.queryByRole("button", { name: "Connect" })).toBeNull();
  });

  it("keeps the session terminal region label for the internal view", () => {
    render(<JarvisSessionTerminal endpoint={null} />);
    expect(
      screen.getByRole("region", { name: "Jarvis session terminal" }),
    ).toBeDefined();
  });

  it("writes raw session output bytes into the terminal emulator", () => {
    const socket = createFakeSocketControl();
    const emulator = createFakeEmulatorControl();
    render(
      <JarvisSessionTerminal
        endpoint="ws://localhost:9999/session"
        createSocket={socket.factory}
        createEmulator={emulator.factory}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Connect" }));
    expect(socket.handlers).not.toBeNull();
    act(() => socket.handlers?.onOpen());

    const outputBytes = textEncoder.encode("[2Jopencode ready");
    act(() => socket.handlers?.onOutputBytes(outputBytes));
    expect(emulator.writtenOutput).toContainEqual(outputBytes);
  });

  it("sends owner keystrokes from the emulator as binary frames", () => {
    const socket = createFakeSocketControl();
    const emulator = createFakeEmulatorControl();
    render(
      <JarvisSessionTerminal
        endpoint="ws://localhost:9999/session"
        createSocket={socket.factory}
        createEmulator={emulator.factory}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Connect" }));
    act(() => socket.handlers?.onOpen());
    act(() => emulator.ownerInputHandler?.(textEncoder.encode("l")));

    expect(
      socket.ownerKeystrokeFrames.map((frame) => textDecoder.decode(frame)),
    ).toContain("l");
  });

  it("sends a resize control frame once the session opens", () => {
    const socket = createFakeSocketControl();
    const emulator = createFakeEmulatorControl();
    emulator.windowSize = { columns: 120, rows: 32 };
    render(
      <JarvisSessionTerminal
        endpoint="ws://localhost:9999/session"
        createSocket={socket.factory}
        createEmulator={emulator.factory}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Connect" }));
    act(() => socket.handlers?.onOpen());

    expect(socket.controlMessages).toContain(
      '{"type":"resize","columns":120,"rows":32}',
    );
  });

  it("disconnects and reflects the closed status", () => {
    const socket = createFakeSocketControl();
    const emulator = createFakeEmulatorControl();
    render(
      <JarvisSessionTerminal
        endpoint="ws://localhost:9999/session"
        createSocket={socket.factory}
        createEmulator={emulator.factory}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Connect" }));
    act(() => socket.handlers?.onOpen());
    fireEvent.click(screen.getByRole("button", { name: "Disconnect" }));

    expect(socket.closed).toBe(true);
    expect(screen.getByText("closed")).toBeDefined();
  });

  it("disposes the terminal emulator on unmount", () => {
    const socket = createFakeSocketControl();
    const emulator = createFakeEmulatorControl();
    const { unmount } = render(
      <JarvisSessionTerminal
        endpoint="ws://localhost:9999/session"
        createSocket={socket.factory}
        createEmulator={emulator.factory}
      />,
    );

    unmount();
    expect(emulator.disposed).toBe(true);
  });
});
