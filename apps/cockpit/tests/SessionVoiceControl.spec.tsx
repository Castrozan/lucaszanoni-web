import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SessionVoiceControl } from "../src/jarvis/SessionVoiceControl";
import type {
  JarvisRecognitionConstructor,
  JarvisSpeechRecognition,
} from "../src/jarvis/use-jarvis-speech";

afterEach(cleanup);

function buildFakeRecognition() {
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
  return {
    Constructor: FakeRecognition as unknown as JarvisRecognitionConstructor,
    instances,
  };
}

describe("SessionVoiceControl", () => {
  it("renders an enabled push-to-talk control when speech recognition is available", () => {
    const { Constructor } = buildFakeRecognition();
    render(
      <SessionVoiceControl
        onSpokenInput={() => {}}
        speechResolvers={{ resolveRecognitionConstructor: () => Constructor }}
      />,
    );
    const button = screen.getByRole("button", {
      name: "Talk to session",
    }) as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });

  it("disables the control where speech recognition is unavailable", () => {
    render(
      <SessionVoiceControl
        onSpokenInput={() => {}}
        speechResolvers={{ resolveRecognitionConstructor: () => null }}
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

  it("reflects the listening state through aria-pressed", () => {
    const { Constructor } = buildFakeRecognition();
    render(
      <SessionVoiceControl
        onSpokenInput={() => {}}
        speechResolvers={{ resolveRecognitionConstructor: () => Constructor }}
      />,
    );
    const button = screen.getByRole("button", { name: "Talk to session" });
    expect(button.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(button);
    expect(button.getAttribute("aria-pressed")).toBe("true");
  });

  it("forwards a recognized transcript to the session input callback", () => {
    const { Constructor, instances } = buildFakeRecognition();
    const onSpokenInput = vi.fn();
    render(
      <SessionVoiceControl
        onSpokenInput={onSpokenInput}
        speechResolvers={{ resolveRecognitionConstructor: () => Constructor }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Talk to session" }));
    instances[0]?.emit("deploy the build");
    expect(onSpokenInput).toHaveBeenCalledWith("deploy the build");
  });
});
