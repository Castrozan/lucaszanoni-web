import { describe, expect, it } from "vitest";
import {
  encodeSessionListCommand,
  encodeSessionSwitchCommand,
} from "../src/sessions/session-commands";

const decoder = new TextDecoder();

describe("session command encoders", () => {
  it("encodes a session switch as the /session command terminated by a carriage return", () => {
    expect(decoder.decode(encodeSessionSwitchCommand("global"))).toBe(
      "/session global\r",
    );
  });

  it("trims surrounding whitespace from the session key before switching", () => {
    expect(decoder.decode(encodeSessionSwitchCommand("  build  "))).toBe(
      "/session build\r",
    );
  });

  it("encodes a session list request as the /sessions command", () => {
    expect(decoder.decode(encodeSessionListCommand())).toBe("/sessions\r");
  });
});
