import { describe, expect, it } from "vitest";
import {
  buildBindingTokenFromEvent,
  capturedTokensToBinding,
} from "../../src/keybinds/keybindCapture";

describe("buildBindingTokenFromEvent", () => {
  it("returns null for a modifier-only key", () => {
    expect(
      buildBindingTokenFromEvent({
        key: "Control",
        ctrlKey: true,
        metaKey: false,
        shiftKey: false,
        altKey: false,
      }),
    ).toBeNull();
  });

  it("builds a lowercase modifier+key token", () => {
    expect(
      buildBindingTokenFromEvent({
        key: "K",
        ctrlKey: true,
        metaKey: false,
        shiftKey: false,
        altKey: false,
      }),
    ).toBe("Control+k");
  });

  it("builds a plain key token", () => {
    expect(
      buildBindingTokenFromEvent({
        key: "p",
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        altKey: false,
      }),
    ).toBe("p");
  });
});

describe("capturedTokensToBinding", () => {
  it("joins a captured sequence with spaces", () => {
    expect(capturedTokensToBinding(["Control+b", "p"])).toBe("Control+b p");
  });
});
