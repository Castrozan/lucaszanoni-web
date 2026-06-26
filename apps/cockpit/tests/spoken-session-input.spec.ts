import { describe, expect, it } from "vitest";
import { encodeSpokenSessionInput } from "../src/jarvis/spoken-session-input";

const decoder = new TextDecoder();

describe("spoken session input encoder", () => {
  it("encodes a recognized phrase as owner keystrokes terminated by a carriage return", () => {
    const bytes = encodeSpokenSessionInput("deploy the build");
    expect(bytes).not.toBeNull();
    expect(decoder.decode(bytes as Uint8Array)).toBe("deploy the build\r");
  });

  it("trims surrounding whitespace before submitting the phrase", () => {
    const bytes = encodeSpokenSessionInput("  status report  ");
    expect(decoder.decode(bytes as Uint8Array)).toBe("status report\r");
  });

  it("returns null for an empty or whitespace-only transcript so nothing is injected", () => {
    expect(encodeSpokenSessionInput("")).toBeNull();
    expect(encodeSpokenSessionInput("   ")).toBeNull();
  });
});
