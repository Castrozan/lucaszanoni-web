import { describe, expect, it } from "vitest";
import {
  appendOwnerMessage,
  composeJarvisAcknowledgement,
  type JarvisUtterance,
} from "../src/jarvis/jarvis-dialogue";

describe("appendOwnerMessage", () => {
  it("appends the owner line and a Jarvis acknowledgement", () => {
    const next = appendOwnerMessage([], "status report");
    expect(next).toEqual<JarvisUtterance[]>([
      { speaker: "owner", text: "status report" },
      { speaker: "jarvis", text: "Standing by on: status report" },
    ]);
  });

  it("preserves earlier turns when appending a new exchange", () => {
    const seed: JarvisUtterance[] = [{ speaker: "jarvis", text: "Online." }];
    const next = appendOwnerMessage(seed, "deploy");
    expect(next).toHaveLength(3);
    expect(next[0]).toEqual(seed[0]);
  });

  it("returns the same transcript reference for a blank message", () => {
    const seed: JarvisUtterance[] = [{ speaker: "owner", text: "hi" }];
    expect(appendOwnerMessage(seed, "   ")).toBe(seed);
  });
});

describe("composeJarvisAcknowledgement", () => {
  it("echoes the trimmed owner message", () => {
    expect(composeJarvisAcknowledgement("  open the dashboard  ")).toBe(
      "Standing by on: open the dashboard",
    );
  });

  it("falls back to a listening prompt for an empty message", () => {
    expect(composeJarvisAcknowledgement("")).toBe("I'm listening.");
  });
});
