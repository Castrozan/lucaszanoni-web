import { afterEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { JarvisSessionTerminal } from "../src/jarvis/JarvisSessionTerminal";
import {
  createFakeEmulatorControl,
  createFakeSocketControl,
} from "./support/jarvis-session-terminal-fakes";

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

const textDecoder = new TextDecoder();

const sessions = [
  { key: "global", label: "Jarvis" },
  { key: "build", label: "Build" },
];

describe("JarvisSessionTerminal multi-session switcher", () => {
  it("hides the session switcher while the multi-session flag is off", () => {
    const socket = createFakeSocketControl();
    const emulator = createFakeEmulatorControl();
    render(
      <JarvisSessionTerminal
        endpoint="ws://localhost:9999/session"
        createSocket={socket.factory}
        createEmulator={emulator.factory}
        sessions={sessions}
        activeSessionKey="global"
      />,
    );

    expect(
      screen.queryByRole("navigation", { name: "Cockpit sessions" }),
    ).toBeNull();
  });

  it("drives a /session switch into the open socket when a session is picked", () => {
    vi.stubEnv("VITE_COCKPIT_MULTI_SESSION", "true");
    const socket = createFakeSocketControl();
    const emulator = createFakeEmulatorControl();
    const onSelectSession = vi.fn();
    render(
      <JarvisSessionTerminal
        endpoint="ws://localhost:9999/session"
        createSocket={socket.factory}
        createEmulator={emulator.factory}
        sessions={sessions}
        activeSessionKey="global"
        onSelectSession={onSelectSession}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Connect" }));
    act(() => socket.handlers?.onOpen());
    fireEvent.click(screen.getByRole("button", { name: "Build" }));

    expect(
      socket.ownerKeystrokeFrames.map((frame) => textDecoder.decode(frame)),
    ).toContain("/session build\r");
    expect(onSelectSession).toHaveBeenCalledExactlyOnceWith("build");
  });

  it("drives a /sessions list request when the list control is used", () => {
    vi.stubEnv("VITE_COCKPIT_MULTI_SESSION", "true");
    const socket = createFakeSocketControl();
    const emulator = createFakeEmulatorControl();
    const onListSessions = vi.fn();
    render(
      <JarvisSessionTerminal
        endpoint="ws://localhost:9999/session"
        createSocket={socket.factory}
        createEmulator={emulator.factory}
        sessions={sessions}
        activeSessionKey="global"
        onListSessions={onListSessions}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Connect" }));
    act(() => socket.handlers?.onOpen());
    fireEvent.click(screen.getByRole("button", { name: /list sessions/i }));

    expect(
      socket.ownerKeystrokeFrames.map((frame) => textDecoder.decode(frame)),
    ).toContain("/sessions\r");
    expect(onListSessions).toHaveBeenCalledOnce();
  });
});
