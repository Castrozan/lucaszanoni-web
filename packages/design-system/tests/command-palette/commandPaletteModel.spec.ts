import { describe, expect, it } from "vitest";
import {
  closedCommandPalette,
  reduceCommandPalette,
} from "../../src/command-palette/commandPaletteModel";

describe("reduceCommandPalette", () => {
  it("opens with an empty query and the first item selected", () => {
    const state = reduceCommandPalette(
      { open: false, query: "stale", selectedIndex: 4 },
      { kind: "opened" },
    );
    expect(state).toEqual({ open: true, query: "", selectedIndex: 0 });
  });

  it("closes back to the rest state", () => {
    const state = reduceCommandPalette(
      { open: true, query: "jar", selectedIndex: 2 },
      { kind: "closed" },
    );
    expect(state).toEqual(closedCommandPalette);
  });

  it("sets the query and resets the selection to the top", () => {
    const state = reduceCommandPalette(
      { open: true, query: "", selectedIndex: 3 },
      { kind: "query-changed", query: "session" },
    );
    expect(state).toEqual({
      open: true,
      query: "session",
      selectedIndex: 3 - 3,
    });
    expect(state.query).toBe("session");
    expect(state.selectedIndex).toBe(0);
  });

  it("wraps the selection past the last result back to the first", () => {
    const state = reduceCommandPalette(
      { open: true, query: "", selectedIndex: 2 },
      { kind: "moved", delta: 1, resultCount: 3 },
    );
    expect(state.selectedIndex).toBe(0);
  });

  it("wraps the selection before the first result to the last", () => {
    const state = reduceCommandPalette(
      { open: true, query: "", selectedIndex: 0 },
      { kind: "moved", delta: -1, resultCount: 3 },
    );
    expect(state.selectedIndex).toBe(2);
  });

  it("keeps the selection at zero when there are no results", () => {
    const state = reduceCommandPalette(
      { open: true, query: "zzz", selectedIndex: 0 },
      { kind: "moved", delta: 1, resultCount: 0 },
    );
    expect(state.selectedIndex).toBe(0);
  });
});
