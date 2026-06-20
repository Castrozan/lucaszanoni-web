import { describe, expect, it } from "vitest";
import { buildBreadcrumbTrail } from "./breadcrumb-trail";

describe("buildBreadcrumbTrail", () => {
  it("returns only the home step when the shell itself is active", () => {
    const trail = buildBreadcrumbTrail("shell");
    expect(trail).toEqual([{ label: "Home", href: "/" }]);
  });

  it("appends the active section after home for a non-shell route", () => {
    const trail = buildBreadcrumbTrail("usage-dashboard");
    expect(trail).toEqual([
      { label: "Home", href: "/" },
      { label: "Claude usage", href: "/engineering/dotfiles/claude/usage/" },
    ]);
  });
});
