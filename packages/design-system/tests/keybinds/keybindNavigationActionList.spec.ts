import { describe, expect, it } from "vitest";
import { buildKeybindNavigationActions } from "../../src/keybinds/keybindNavigationActionList";

describe("buildKeybindNavigationActions", () => {
  it("registers home and the primary apps with leader-g bindings", () => {
    const actions = buildKeybindNavigationActions();
    const actionById = Object.fromEntries(
      actions.map((action) => [action.id, action]),
    );
    expect(actionById["nav.home"]).toMatchObject({
      defaultBinding: "Leader g h",
      href: "/",
    });
    expect(actionById["nav.cockpit"]).toMatchObject({
      defaultBinding: "Leader g c",
      href: "/cockpit/",
      label: "Go to Cockpit",
    });
    expect(actionById["nav.workspace"]).toMatchObject({
      defaultBinding: "Leader g w",
      href: "/workspace/",
    });
  });
});
