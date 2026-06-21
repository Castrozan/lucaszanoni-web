import { describe, expect, it } from "vitest";
import { cockpitViews } from "../src/navigation/cockpit-views";

describe("cockpitViews", () => {
  it("registers the dashboard at the cockpit root path", () => {
    const dashboardView = cockpitViews.find((view) => view.id === "dashboard");
    expect(dashboardView?.path).toBe("/");
  });

  it("registers the user view at /user", () => {
    const userView = cockpitViews.find((view) => view.id === "user");
    expect(userView?.path).toBe("/user");
  });

  it("keeps every view path unique so a leader-key switch is unambiguous", () => {
    const paths = cockpitViews.map((view) => view.path);
    expect(new Set(paths).size).toBe(paths.length);
  });
});
