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
import type {
  JarvisRecognitionConstructor,
  JarvisSpeechRecognition,
} from "../src/jarvis/use-jarvis-speech";

const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();

const sessions = [{ key: "global", label: "Jarvis" }];

function captureSpokenSynthesis() {
  const spoken: string[] = [];
  return {
    spoken,
    resolvers: {
      resolveRecognitionConstructor: () => null,
      resolveSynthesis: () => ({
        speak: (utterance: unknown) =>
          spoken.push((utterance as { text: string }).text),
        cancel: () => {},
      }),
      createUtterance: (text: string) => ({ text }),
    },
  };
}

function installFakeRecognition() {
  const instances: FakeRecognition[] = [];
  class FakeRecognition implements JarvisSpeechRecognition {
    lang = "";
    interimResults = false;
    continuous = false;
    onresult:
      | ((event: {
          results: ArrayLike<ArrayLike<{ transcript: string }>>;
        }) => void)
      | null = null;
    onend: (() => void) | null = null;
    onerror: (() => void) | null = null;
    start() {
      instances.push(this);
    }
    stop() {
      this.onend?.();
    }
    emit(transcript: string) {
      this.onresult?.({ results: [[{ transcript }]] });
    }
  }
  (
    window as unknown as { SpeechRecognition: JarvisRecognitionConstructor }
  ).SpeechRecognition =
    FakeRecognition as unknown as JarvisRecognitionConstructor;
  return instances;
}

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  delete (window as unknown as { SpeechRecognition?: unknown })
    .SpeechRecognition;
  delete (window as unknown as { webkitSpeechRecognition?: unknown })
    .webkitSpeechRecognition;
});

describe("JarvisSessionTerminal voice control", () => {
  it("disables the voice control when speech recognition is unavailable", () => {
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
      (
        screen.getByRole("button", {
          name: "Talk to session",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });

  it("forwards a recognized phrase into the open socket as owner keystrokes", () => {
    const instances = installFakeRecognition();
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

    fireEvent.click(screen.getByRole("button", { name: "Connect" }));
    act(() => socket.handlers?.onOpen());
    fireEvent.click(screen.getByRole("button", { name: "Talk to session" }));
    act(() => instances[0]?.emit("deploy the build"));

    expect(
      socket.ownerKeystrokeFrames.map((frame) => textDecoder.decode(frame)),
    ).toContain("deploy the build\r");
  });

  it("speaks new settled session output through speech synthesis by default", () => {
    vi.useFakeTimers();
    try {
      const { spoken, resolvers } = captureSpokenSynthesis();
      const socket = createFakeSocketControl();
      const emulator = createFakeEmulatorControl();
      render(
        <JarvisSessionTerminal
          endpoint="ws://localhost:9999/session"
          createSocket={socket.factory}
          createEmulator={emulator.factory}
          sessions={sessions}
          activeSessionKey="global"
          speakDebounceMs={20}
          speechResolvers={resolvers}
        />,
      );

      act(() => socket.handlers?.onOpen());
      act(() =>
        socket.handlers?.onOutputBytes(
          textEncoder.encode("\x1b[2Jbuild succeeded\n"),
        ),
      );
      act(() => vi.advanceTimersByTime(40));

      expect(spoken).toContain("build succeeded");
    } finally {
      vi.useRealTimers();
    }
  });

  it("stops speaking session output once the owner mutes spoken output", () => {
    vi.useFakeTimers();
    try {
      const { spoken, resolvers } = captureSpokenSynthesis();
      const socket = createFakeSocketControl();
      const emulator = createFakeEmulatorControl();
      render(
        <JarvisSessionTerminal
          endpoint="ws://localhost:9999/session"
          createSocket={socket.factory}
          createEmulator={emulator.factory}
          sessions={sessions}
          activeSessionKey="global"
          speakDebounceMs={20}
          speechResolvers={resolvers}
        />,
      );

      act(() => socket.handlers?.onOpen());
      fireEvent.click(
        screen.getByRole("button", { name: "Speak session output" }),
      );
      act(() =>
        socket.handlers?.onOutputBytes(
          textEncoder.encode("\x1b[2Jhidden status\n"),
        ),
      );
      act(() => vi.advanceTimersByTime(40));

      expect(spoken).toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });
});
