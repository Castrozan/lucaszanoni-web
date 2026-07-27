import { describe, expect, it } from "vitest";
import { wrapHighlightIndex } from "../../src/keybinds/useKeybindHelpNavigation";

describe("wrapHighlightIndex", () => {
  it("wraps forward past the end back to the first row", () => {
    expect(wrapHighlightIndex(2, 1, 3)).toBe(0);
  });

  it("wraps backward past the first row to the last row", () => {
    expect(wrapHighlightIndex(0, -1, 3)).toBe(2);
  });

  it("returns zero when there are no rows regardless of the current index or delta", () => {
    expect(wrapHighlightIndex(0, -1, 0)).toBe(0);
    expect(wrapHighlightIndex(5, 3, 0)).toBe(0);
  });

  it("moves within bounds without wrapping", () => {
    expect(wrapHighlightIndex(0, 1, 3)).toBe(1);
  });

  it("never leaks a negative index for a delta larger than the row count", () => {
    expect(wrapHighlightIndex(0, -5, 3)).toBe(1);
  });
});
