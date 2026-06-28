import { describe, expect, it } from "vitest";
import { formatBindingForDisplay } from "../../src/keybinds/keybindDisplay";

describe("formatBindingForDisplay", () => {
  it("formats a single modifier combo", () => {
    expect(formatBindingForDisplay("Mod+k", "Control+b")).toBe("Mod+K");
  });

  it("expands the leader and joins a sequence with 'then'", () => {
    expect(formatBindingForDisplay("Leader p", "Control+b")).toBe(
      "Ctrl+B then P",
    );
  });

  it("passes a plain key through", () => {
    expect(formatBindingForDisplay("/", "Control+b")).toBe("/");
  });
});
