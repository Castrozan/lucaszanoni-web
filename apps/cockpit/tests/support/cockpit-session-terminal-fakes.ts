import type {
  SessionTerminalEmulator,
  SessionTerminalEmulatorFactory,
  SessionTerminalSocket,
  SessionTerminalSocketFactory,
  SessionTerminalSocketHandlers,
} from "@platform/workspace";

export interface FakeSocketControl {
  factory: SessionTerminalSocketFactory;
  handlers: SessionTerminalSocketHandlers | null;
  ownerKeystrokeFrames: Uint8Array[];
  controlMessages: string[];
  closed: boolean;
}

export function createFakeSocketControl(): FakeSocketControl {
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
          handlers.onClose?.("closed by client");
        },
      };
      return socket;
    },
  };
  return control;
}

export interface FakeEmulatorControl {
  factory: SessionTerminalEmulatorFactory;
  writtenOutput: Uint8Array[];
  ownerInputHandler: ((bytes: Uint8Array) => void) | null;
  windowSize: { columns: number; rows: number };
  disposed: boolean;
  focusCount: number;
}

export function createFakeEmulatorControl(): FakeEmulatorControl {
  const control: FakeEmulatorControl = {
    writtenOutput: [],
    ownerInputHandler: null,
    windowSize: { columns: 100, rows: 30 },
    disposed: false,
    focusCount: 0,
    factory: () => {
      const emulator: SessionTerminalEmulator = {
        attachTo: () => control.windowSize,
        writeOutputBytes: (bytes) => control.writtenOutput.push(bytes),
        onOwnerInput: (handler) => {
          control.ownerInputHandler = handler;
        },
        fitToContainer: () => control.windowSize,
        focus: () => {
          control.focusCount += 1;
        },
        dispose: () => {
          control.disposed = true;
        },
      };
      return emulator;
    },
  };
  return control;
}
