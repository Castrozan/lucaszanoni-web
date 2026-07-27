import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { KeybindProvider } from "@platform/design-system";
import { SessionTerminal } from "../../src/workspace/SessionTerminal";
import type {
  SessionTerminalSocket,
  SessionTerminalSocketHandlers,
} from "../../src/workspace/session-terminal-socket";
import type {
  SessionTerminalEmulator,
  SessionTerminalEmulatorFactory,
} from "../../src/workspace/session-terminal-emulator";

afterEach(cleanup);

function createInMemoryPreferenceStorage() {
  const entries = new Map<string, string>();
  return {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => {
      entries.set(key, value);
    },
  };
}

function createRecordingSocket(ownerKeystrokeFrames: Uint8Array[]) {
  return (_endpoint: string, _handlers: SessionTerminalSocketHandlers) => {
    const socket: SessionTerminalSocket = {
      sendOwnerKeystrokes: (bytes) => ownerKeystrokeFrames.push(bytes),
      sendControlMessage: () => {},
      close: () => {},
    };
    return socket;
  };
}

const createSilentEmulator: SessionTerminalEmulatorFactory = () => {
  const emulator: SessionTerminalEmulator = {
    attachTo: () => ({ columns: 80, rows: 24 }),
    writeOutputBytes: () => {},
    onOwnerInput: () => {},
    fitToContainer: () => ({ columns: 80, rows: 24 }),
    focus: () => {},
    dispose: () => {},
  };
  return emulator;
};

function renderTerminalWithKeybinds(ownerKeystrokeFrames: Uint8Array[]) {
  return render(
    <KeybindProvider storage={createInMemoryPreferenceStorage()}>
      <SessionTerminal
        endpoint="wss://kira.example/cockpit/jarvis-session/"
        createSocket={createRecordingSocket(ownerKeystrokeFrames)}
        createTerminal={createSilentEmulator}
      />
    </KeybindProvider>,
  );
}

describe("the doubled leader chord sends a literal prefix to the session", () => {
  it("writes the leader control byte into the session on a doubled press", () => {
    const ownerKeystrokeFrames: Uint8Array[] = [];
    renderTerminalWithKeybinds(ownerKeystrokeFrames);

    fireEvent.keyDown(window, { key: "b", ctrlKey: true });
    fireEvent.keyDown(window, { key: "b", ctrlKey: true });

    expect(ownerKeystrokeFrames).toEqual([new Uint8Array([2])]);
  });

  it("sends nothing to the session on a single leader press", () => {
    const ownerKeystrokeFrames: Uint8Array[] = [];
    renderTerminalWithKeybinds(ownerKeystrokeFrames);

    fireEvent.keyDown(window, { key: "b", ctrlKey: true });

    expect(ownerKeystrokeFrames).toEqual([]);
  });
});
