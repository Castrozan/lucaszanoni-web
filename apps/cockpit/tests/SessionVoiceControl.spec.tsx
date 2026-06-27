import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  SessionVoiceControl,
  type SessionVoiceControlProps,
} from "../src/jarvis/SessionVoiceControl";

afterEach(cleanup);

function renderControl(overrides: Partial<SessionVoiceControlProps> = {}) {
  const props: SessionVoiceControlProps = {
    isListening: false,
    recognitionSupported: true,
    onToggleListening: vi.fn(),
    synthesisSupported: true,
    spokenOutputMuted: false,
    onToggleSpokenOutput: vi.fn(),
    ...overrides,
  };
  render(<SessionVoiceControl {...props} />);
  return props;
}

function talkButton() {
  return screen.getByRole("button", {
    name: "Talk to session",
  }) as HTMLButtonElement;
}

function speakButton() {
  return screen.getByRole("button", {
    name: "Speak session output",
  }) as HTMLButtonElement;
}

describe("SessionVoiceControl", () => {
  it("renders an enabled push-to-talk control when recognition is available", () => {
    renderControl({ recognitionSupported: true });
    expect(talkButton().disabled).toBe(false);
  });

  it("disables push-to-talk when recognition is unavailable", () => {
    renderControl({ recognitionSupported: false });
    expect(talkButton().disabled).toBe(true);
  });

  it("reflects the listening state through aria-pressed and toggles on click", () => {
    const props = renderControl({ isListening: true });
    expect(talkButton().getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(talkButton());
    expect(props.onToggleListening).toHaveBeenCalledTimes(1);
  });

  it("renders an enabled spoken-output control speaking by default", () => {
    renderControl({ synthesisSupported: true, spokenOutputMuted: false });
    const button = speakButton();
    expect(button.disabled).toBe(false);
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(button.textContent).toBe("Speaking");
  });

  it("disables the spoken-output control when synthesis is unavailable", () => {
    renderControl({ synthesisSupported: false });
    expect(speakButton().disabled).toBe(true);
  });

  it("reflects the muted state and toggles spoken output on click", () => {
    const props = renderControl({ spokenOutputMuted: true });
    const button = speakButton();
    expect(button.getAttribute("aria-pressed")).toBe("false");
    expect(button.textContent).toBe("Muted");
    fireEvent.click(button);
    expect(props.onToggleSpokenOutput).toHaveBeenCalledTimes(1);
  });
});
