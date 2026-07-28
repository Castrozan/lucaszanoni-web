import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
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

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

interface ReconnectingSocketControl {
  factory: SessionTerminalSocketFactory;
  connections: SessionTerminalSocketHandlers[];
}

function createReconnectingSocketControl(): ReconnectingSocketControl {
  const control: ReconnectingSocketControl = {
    connections: [],
    factory: (_endpoint, handlers) => {
      control.connections.push(handlers);
      const socket: SessionTerminalSocket = {
        sendOwnerKeystrokes: () => {},
        sendControlMessage: () => {},
        close: () => {},
      };
      return socket;
    },
  };
  return control;
}

const SILENT_TERMINAL_WINDOW_SIZE = { columns: 80, rows: 24 };

function createSilentTerminalFactory(): SessionTerminalEmulatorFactory {
  return () => {
    const terminal: SessionTerminalEmulator = {
      attachTo: () => SILENT_TERMINAL_WINDOW_SIZE,
      writeOutputBytes: () => {},
      onOwnerInput: () => {},
      fitToContainer: () => SILENT_TERMINAL_WINDOW_SIZE,
      focus: () => {},
      dispose: () => {},
    };
    return terminal;
  };
}

function renderSessionTerminal(control: ReconnectingSocketControl) {
  return render(
    <SessionTerminal
      endpoint="wss://host.example/cockpit/jarvis-session/?sessionName=dotfiles"
      createSocket={control.factory}
      createTerminal={createSilentTerminalFactory()}
    />,
  );
}

describe("a dropped session socket recovers instead of leaving a dead screen", () => {
  it("says it lost the session when the socket closes", () => {
    const control = createReconnectingSocketControl();
    renderSessionTerminal(control);

    act(() => control.connections[0]?.onOpen());
    expect(screen.queryByRole("status")).toBeNull();

    act(() => control.connections[0]?.onClose?.("code 1006"));

    expect(screen.getByRole("status").textContent).toContain("Reconnecting");
  });

  it("opens a fresh socket after the retry delay", () => {
    vi.useFakeTimers();
    const control = createReconnectingSocketControl();
    renderSessionTerminal(control);

    act(() => control.connections[0]?.onOpen());
    act(() => control.connections[0]?.onClose?.("code 1006"));
    expect(control.connections.length).toBe(1);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(control.connections.length).toBe(2);
  });

  it("clears the notice once the fresh socket opens", () => {
    vi.useFakeTimers();
    const control = createReconnectingSocketControl();
    renderSessionTerminal(control);

    act(() => control.connections[0]?.onOpen());
    act(() => control.connections[0]?.onClose?.("code 1006"));
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    act(() => control.connections[1]?.onOpen());

    expect(screen.queryByRole("status")).toBeNull();
  });
});
