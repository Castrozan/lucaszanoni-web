import { describe, expect, it } from "vitest";
import { selectPreferredSpeechVoice } from "../src/jarvis/preferred-speech-voice";

function fakeVoice(name: string, lang: string): SpeechSynthesisVoice {
  return { name, lang } as SpeechSynthesisVoice;
}

describe("selectPreferredSpeechVoice", () => {
  it("returns null when no voices are available", () => {
    expect(selectPreferredSpeechVoice([])).toBeNull();
  });

  it("prefers a curated natural voice over a generic robotic default even when the robotic one is listed first", () => {
    const voices = [
      fakeVoice("Albert", "en-US"),
      fakeVoice("Samantha", "en-US"),
    ];
    expect(selectPreferredSpeechVoice(voices)?.name).toBe("Samantha");
  });

  it("falls back to an en-US voice when no curated voice is present", () => {
    const voices = [fakeVoice("Eddy", "de-DE"), fakeVoice("Daniel", "en-US")];
    expect(selectPreferredSpeechVoice(voices)?.name).toBe("Daniel");
  });

  it("falls back to any English voice when no en-US voice is present", () => {
    const voices = [fakeVoice("Eddy", "de-DE"), fakeVoice("Arthur", "en-GB")];
    expect(selectPreferredSpeechVoice(voices)?.name).toBe("Arthur");
  });

  it("returns null when no English voice is available at all", () => {
    const voices = [fakeVoice("Eddy", "de-DE"), fakeVoice("Yuna", "ko-KR")];
    expect(selectPreferredSpeechVoice(voices)).toBeNull();
  });
});
