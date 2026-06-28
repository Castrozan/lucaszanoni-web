import { describe, expect, it } from "vitest";
import { buildKeybindBindingViews } from "../../src/keybinds/keybindViews";

const actions = [
  { id: "palette.open", label: "Open palette", defaultBinding: "Leader p" },
  { id: "help", label: "Help", defaultBinding: "?" },
];

describe("buildKeybindBindingViews", () => {
  it("uses the default binding when there is no override", () => {
    const views = buildKeybindBindingViews(actions, {});
    expect(views[0]).toMatchObject({
      id: "palette.open",
      currentBinding: "Leader p",
      isOverridden: false,
    });
  });

  it("applies an override as the current binding", () => {
    const views = buildKeybindBindingViews(actions, {
      "palette.open": "Mod+p",
    });
    const view = views.find((candidate) => candidate.id === "palette.open");
    expect(view).toMatchObject({
      defaultBinding: "Leader p",
      currentBinding: "Mod+p",
      isOverridden: true,
    });
  });
});
