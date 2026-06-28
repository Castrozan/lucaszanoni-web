import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import { SessionTerminal } from "../../src/workspace/SessionTerminal";
import type {
  SessionTerminalSocket,
  SessionTerminalSocketFactory,
  SessionTerminalSocketHandlers,
} from "../../src/workspace/session-terminal-socket";
import type {
  SessionTerminalEmulator,
  SessionTerminalEmulatorFactory,
} from "../../src/workspace/session-terminal-emulator";

afterEach(cleanup);

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

interface FakeSocketControl {
  factory: SessionTerminalSocketFactory;
  handlers: SessionTerminalSocketHandlers | null;
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
      const socket: SessionTerminalSocket = {
        sendOwnerKeystrokes: (bytes) =>
          control.ownerKeystrokeFrames.push(bytes),
        sendControlMessage: (message) => control.controlMessages.push(message),
        close: () => {
          control.closed = true;
        },
      };
      return socket;
    },
  };
  return control;
}

interface FakeTerminalControl {
  factory: SessionTerminalEmulatorFactory;
  attachedContainer: HTMLElement | null;
  writtenOutput: Uint8Array[];
  ownerInputHandler: ((bytes: Uint8Array) => void) | null;
  windowSize: { columns: number; rows: number };
  disposed: boolean;
}

function createFakeTerminalControl(): FakeTerminalControl {
  const control: FakeTerminalControl = {
    attachedContainer: null,
    writtenOutput: [],
    ownerInputHandler: null,
    windowSize: { columns: 100, rows: 30 },
    disposed: false,
    factory: () => {
      const terminal: SessionTerminalEmulator = {
        attachTo: (container) => {
          control.attachedContainer = container;
          return control.windowSize;
        },
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
      return terminal;
    },
  };
  return control;
}

const attachEndpoint =
  "wss://kira.example/cockpit/jarvis-session/?sessionName=dotfiles";

describe("SessionTerminal drives a live cockpit session over the attach websocket", () => {
  it("attaches the terminal to its container and opens the socket on mount", () => {
    const socket = createFakeSocketControl();
    const terminal = createFakeTerminalControl();
    render(
      <SessionTerminal
        endpoint={attachEndpoint}
        createSocket={socket.factory}
        createTerminal={terminal.factory}
      />,
    );

    expect(terminal.attachedContainer).not.toBeNull();
    expect(socket.handlers).not.toBeNull();
  });

  it("writes received session bytes into the terminal", () => {
    const socket = createFakeSocketControl();
    const terminal = createFakeTerminalControl();
    render(
      <SessionTerminal
        endpoint={attachEndpoint}
        createSocket={socket.factory}
        createTerminal={terminal.factory}
      />,
    );

    const outputBytes = textEncoder.encode("opencode ready");
    act(() => socket.handlers?.onOutputBytes(outputBytes));

    expect(terminal.writtenOutput).toContainEqual(outputBytes);
  });

  it("sends terminal input back to the socket as owner keystroke bytes", () => {
    const socket = createFakeSocketControl();
    const terminal = createFakeTerminalControl();
    render(
      <SessionTerminal
        endpoint={attachEndpoint}
        createSocket={socket.factory}
        createTerminal={terminal.factory}
      />,
    );

    act(() => terminal.ownerInputHandler?.(textEncoder.encode("l")));

    expect(
      socket.ownerKeystrokeFrames.map((frame) => textDecoder.decode(frame)),
    ).toContain("l");
  });

  it("sends a resize control frame once the session socket opens", () => {
    const socket = createFakeSocketControl();
    const terminal = createFakeTerminalControl();
    terminal.windowSize = { columns: 120, rows: 32 };
    render(
      <SessionTerminal
        endpoint={attachEndpoint}
        createSocket={socket.factory}
        createTerminal={terminal.factory}
      />,
    );

    act(() => socket.handlers?.onOpen());

    expect(socket.controlMessages).toContain(
      '{"type":"resize","columns":120,"rows":32}',
    );
  });

  it("closes the socket and disposes the terminal on unmount", () => {
    const socket = createFakeSocketControl();
    const terminal = createFakeTerminalControl();
    const { unmount } = render(
      <SessionTerminal
        endpoint={attachEndpoint}
        createSocket={socket.factory}
        createTerminal={terminal.factory}
      />,
    );

    unmount();

    expect(socket.closed).toBe(true);
    expect(terminal.disposed).toBe(true);
  });
});
