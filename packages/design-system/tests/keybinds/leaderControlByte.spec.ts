import { describe, expect, it } from "vitest";
import { controlByteForLeaderBinding } from "../../src/keybinds/leaderControlByte";

describe("controlByteForLeaderBinding", () => {
  it("maps the default tmux prefix to its ascii control byte", () => {
    expect(controlByteForLeaderBinding("Control+b")).toBe(2);
  });

  it("follows a leader rebound to another letter", () => {
    expect(controlByteForLeaderBinding("Control+a")).toBe(1);
  });

  it("accepts the platform-agnostic mod prefix", () => {
    expect(controlByteForLeaderBinding("Mod+b")).toBe(2);
  });

  it("has no control byte for a leader without a control modifier", () => {
    expect(controlByteForLeaderBinding("b")).toBeNull();
  });

  it("has no control byte for a leader that is not a letter", () => {
    expect(controlByteForLeaderBinding("Control+space")).toBeNull();
  });
});
