import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import {
  extractRecognitionTranscript,
  useJarvisSpeech,
  type JarvisRecognitionEvent,
  type JarvisSpeechRecognition,
} from "../src/jarvis/use-jarvis-speech";

afterEach(cleanup);

class FakeRecognition implements JarvisSpeechRecognition {
  static last: FakeRecognition | null = null;
  lang = "";
  interimResults = false;
  continuous = false;
  onresult: ((event: JarvisRecognitionEvent) => void) | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  started = false;
  start() {
    this.started = true;
    FakeRecognition.last = this;
  }
  stop() {
    this.onend?.();
  }
  static reset() {
    FakeRecognition.last = null;
  }
}

describe("extractRecognitionTranscript", () => {
  it("reads the transcript of the latest result", () => {
    expect(
      extractRecognitionTranscript({
        results: [[{ transcript: "  hello jarvis " }]],
      }),
    ).toBe("hello jarvis");
  });

  it("returns an empty string when there is no result", () => {
    expect(extractRecognitionTranscript({ results: [] })).toBe("");
  });
});

describe("useJarvisSpeech", () => {
  it("degrades to unsupported and no-ops when neither speech API is present", () => {
    const { result } = renderHook(() =>
      useJarvisSpeech(() => {}, {
        resolveRecognitionConstructor: () => null,
        resolveSynthesis: () => null,
      }),
    );
    expect(result.current.recognitionSupported).toBe(false);
    expect(result.current.synthesisSupported).toBe(false);
    expect(() => act(() => result.current.toggleListening())).not.toThrow();
    expect(() => act(() => result.current.speak("noop"))).not.toThrow();
    expect(result.current.isListening).toBe(false);
  });

  it("starts recognition and feeds the transcript to the consumer", () => {
    FakeRecognition.reset();
    const onTranscript = vi.fn();
    const { result } = renderHook(() =>
      useJarvisSpeech(onTranscript, {
        resolveRecognitionConstructor: () => FakeRecognition,
        resolveSynthesis: () => null,
      }),
    );
    expect(result.current.recognitionSupported).toBe(true);
    act(() => result.current.toggleListening());
    expect(result.current.isListening).toBe(true);
    expect(FakeRecognition.last?.started).toBe(true);
    act(() => {
      FakeRecognition.last?.onresult?.({
        results: [[{ transcript: "open the dashboard" }]],
      });
    });
    expect(onTranscript).toHaveBeenCalledWith("open the dashboard");
    act(() => result.current.toggleListening());
    expect(result.current.isListening).toBe(false);
  });

  it("speaks through the resolved synthesis after cancelling prior speech", () => {
    const speak = vi.fn();
    const cancel = vi.fn();
    const { result } = renderHook(() =>
      useJarvisSpeech(() => {}, {
        resolveRecognitionConstructor: () => null,
        resolveSynthesis: () => ({ speak, cancel }),
        createUtterance: (text) => ({ text }),
      }),
    );
    expect(result.current.synthesisSupported).toBe(true);
    act(() => result.current.speak("at your service"));
    expect(cancel).toHaveBeenCalledOnce();
    expect(speak).toHaveBeenCalledWith({ text: "at your service" });
  });
});
