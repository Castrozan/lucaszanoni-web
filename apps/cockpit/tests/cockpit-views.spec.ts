import { describe, expect, it } from "vitest";
import { buildKeybindNavigationActions } from "@platform/design-system";
import {
  cockpitViews,
  findCockpitViewByPath,
} from "../src/navigation/cockpit-views";

describe("cockpitViews", () => {
  it("registers the owner dashboard at the cockpit index path", () => {
    const dashboardView = cockpitViews.find((view) => view.id === "dashboard");
    expect(dashboardView?.path).toBe("/");
  });

  it("moves the agent terminal off the index to /terminal", () => {
    const terminalView = cockpitViews.find((view) => view.id === "terminal");
    expect(terminalView?.path).toBe("/terminal");
  });

  it("lists the dashboard first so the owner lands there on entry", () => {
    expect(cockpitViews[0]?.id).toBe("dashboard");
  });

  it("registers the user view at /user", () => {
    const userView = cockpitViews.find((view) => view.id === "user");
    expect(userView?.path).toBe("/user");
  });

  it("moves the Jarvis terminal off the index to /jarvis", () => {
    const jarvisView = cockpitViews.find((view) => view.id === "jarvis");
    expect(jarvisView?.path).toBe("/jarvis");
  });

  it("keeps every view path unique so a leader-key switch is unambiguous", () => {
    const paths = cockpitViews.map((view) => view.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("fills the viewport for the terminal and for nothing else", () => {
    const viewportFillingIds = cockpitViews
      .filter((view) => view.fillsViewport)
      .map((view) => view.id);
    expect(viewportFillingIds).toEqual(["terminal"]);
  });

  it("resolves a view from the path the router reports", () => {
    expect(findCockpitViewByPath("/terminal")?.id).toBe("terminal");
    expect(findCockpitViewByPath("/does-not-exist")).toBeNull();
  });

  it("gives every view its own go-to key", () => {
    const leaderKeys = cockpitViews.map((view) => view.leaderKey);
    expect(new Set(leaderKeys).size).toBe(leaderKeys.length);
  });

  it("takes no go-to key the platform navigation already claims", () => {
    const platformGoToKeys = buildKeybindNavigationActions().map((action) =>
      action.defaultBinding.replace("Leader g ", ""),
    );
    const collisions = cockpitViews
      .map((view) => view.leaderKey)
      .filter((leaderKey) => platformGoToKeys.includes(leaderKey));
    expect(collisions).toEqual([]);
  });
});
