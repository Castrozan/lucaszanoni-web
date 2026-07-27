import { describe, expect, it } from "vitest";
import { buildPlatformStatusBarModel } from "../../src/status-bar/platformStatusBarModel";
import type { StatusBarLinkWindowModel } from "../../src/status-bar/statusBarModel";

describe("buildPlatformStatusBarModel", () => {
  it("builds the reports session with its four declared windows and only the current one flagged active", () => {
    const model = buildPlatformStatusBarModel(
      "/engineering/dotfiles/reports/quality",
    );
    expect(model.sessionLabel).toBe("Reports");
    expect(model.windows).toHaveLength(4);

    const linkWindows = model.windows.filter(
      (window): window is StatusBarLinkWindowModel => window.kind === "link",
    );
    expect(linkWindows).toHaveLength(model.windows.length);
    expect(linkWindows.map((window) => window.href)).toEqual([
      "/engineering/dotfiles/reports/",
      "/engineering/dotfiles/reports/quality",
      "/engineering/dotfiles/reports/baseline",
      "/engineering/dotfiles/reports/coverage",
    ]);

    const activeWindows = model.windows.filter((window) => window.isActive);
    expect(activeWindows).toHaveLength(1);
    expect(activeWindows[0]?.label).toBe("Quality");
  });

  it("returns the home session label with no windows for an empty pathname", () => {
    const model = buildPlatformStatusBarModel("");
    expect(model.sessionLabel).toBe("Home");
    expect(model.windows).toEqual([]);
  });
});
