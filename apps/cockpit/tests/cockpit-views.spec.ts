import { describe, expect, it } from "vitest";
import { cockpitViews } from "../src/navigation/cockpit-views";

describe("cockpitViews", () => {
  it("registers the workspace agent terminal at the cockpit index path", () => {
    const workspaceView = cockpitViews.find((view) => view.id === "workspace");
    expect(workspaceView?.path).toBe("/");
  });

  it("registers the dashboard hub at /dashboard", () => {
    const dashboardView = cockpitViews.find((view) => view.id === "dashboard");
    expect(dashboardView?.path).toBe("/dashboard");
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
});
