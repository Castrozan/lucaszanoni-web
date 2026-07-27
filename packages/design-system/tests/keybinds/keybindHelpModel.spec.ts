import { describe, expect, it } from "vitest";
import {
  countBindingCollisions,
  filterAndSortBindings,
} from "../../src/keybinds/keybindHelpModel";
import type { KeybindBindingView } from "../../src/keybinds/keybindViews";

function buildBindingView(
  overrides: Partial<KeybindBindingView> = {},
): KeybindBindingView {
  return {
    id: "palette.open",
    label: "Open palette",
    defaultBinding: "Leader p",
    currentBinding: "Leader p",
    isOverridden: false,
    ...overrides,
  };
}

describe("countBindingCollisions", () => {
  it("returns an empty map for an empty binding list", () => {
    expect(countBindingCollisions([])).toEqual(new Map());
  });

  it("counts each distinct current binding once", () => {
    const bindings = [
      buildBindingView({ id: "palette.open", currentBinding: "Mod+p" }),
      buildBindingView({ id: "help.toggle", currentBinding: "Mod+?" }),
    ];
    const collisions = countBindingCollisions(bindings);
    expect(collisions.get("Mod+p")).toBe(1);
    expect(collisions.get("Mod+?")).toBe(1);
  });

  it("counts a current binding duplicated across two actions as two", () => {
    const bindings = [
      buildBindingView({ id: "palette.open", currentBinding: "Mod+k" }),
      buildBindingView({ id: "jarvis.jump", currentBinding: "Mod+k" }),
    ];
    const collisions = countBindingCollisions(bindings);
    expect(collisions.get("Mod+k")).toBe(2);
  });
});

describe("filterAndSortBindings", () => {
  it("returns every binding sorted by label when the query is empty", () => {
    const bindings = [
      buildBindingView({ id: "jarvis.jump", label: "Jump to Jarvis" }),
      buildBindingView({ id: "palette.open", label: "Open palette" }),
      buildBindingView({ id: "help.toggle", label: "Toggle help" }),
    ];
    const result = filterAndSortBindings(bindings, "");
    expect(result.map((binding) => binding.id)).toEqual([
      "jarvis.jump",
      "palette.open",
      "help.toggle",
    ]);
  });

  it("matches a query case-insensitively against the label", () => {
    const bindings = [
      buildBindingView({ id: "jarvis.jump", label: "Jump to Jarvis" }),
      buildBindingView({ id: "palette.open", label: "Open palette" }),
    ];
    const result = filterAndSortBindings(bindings, "JARVIS");
    expect(result.map((binding) => binding.id)).toEqual(["jarvis.jump"]);
  });

  it("matches a query case-insensitively against the current binding", () => {
    const bindings = [
      buildBindingView({
        id: "jarvis.jump",
        label: "Jump to Jarvis",
        currentBinding: "Mod+J",
      }),
      buildBindingView({
        id: "palette.open",
        label: "Open palette",
        currentBinding: "Mod+K",
      }),
    ];
    const result = filterAndSortBindings(bindings, "mod+k");
    expect(result.map((binding) => binding.id)).toEqual(["palette.open"]);
  });

  it("returns an empty array for a query that matches nothing", () => {
    const bindings = [buildBindingView()];
    expect(filterAndSortBindings(bindings, "zzz")).toEqual([]);
  });

  it("does not mutate the input array", () => {
    const bindings = [
      buildBindingView({ id: "jarvis.jump", label: "Jump to Jarvis" }),
      buildBindingView({ id: "help.toggle", label: "Toggle help" }),
      buildBindingView({ id: "palette.open", label: "Open palette" }),
    ];
    const result = filterAndSortBindings(bindings, "");
    expect(bindings.map((binding) => binding.id)).toEqual([
      "jarvis.jump",
      "help.toggle",
      "palette.open",
    ]);
    expect(result).not.toBe(bindings);
  });
});
