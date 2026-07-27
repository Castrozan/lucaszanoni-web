import { afterEach, describe, expect, it, vi } from "vitest";
import { buildLandingStatusBarModel } from "../src/landing/LandingStatusBar";
import {
  COCKPIT_SECTION_ID,
  HERO_SECTION_ID,
  LANDING_SECTIONS,
  SHOWCASE_SECTION_ID,
} from "../src/landing/landingSections";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("buildLandingStatusBarModel", () => {
  it("labels the session Atrium", () => {
    const model = buildLandingStatusBarModel(HERO_SECTION_ID);
    expect(model.sessionLabel).toBe("Atrium");
  });

  it("builds one action window per landing section in declaration order", () => {
    const model = buildLandingStatusBarModel(HERO_SECTION_ID);
    expect(model.windows.map((statusBarWindow) => statusBarWindow.id)).toEqual(
      LANDING_SECTIONS.map((section) => section.id),
    );
    for (const statusBarWindow of model.windows) {
      expect(statusBarWindow.kind).toBe("action");
    }
  });

  it("builds exactly one window per entry in LANDING_SECTIONS", () => {
    const model = buildLandingStatusBarModel(HERO_SECTION_ID);
    expect(model.windows).toHaveLength(LANDING_SECTIONS.length);
  });

  it("flags exactly the window matching the active section id as active", () => {
    const model = buildLandingStatusBarModel(COCKPIT_SECTION_ID);
    const activeWindows = model.windows.filter(
      (statusBarWindow) => statusBarWindow.isActive,
    );
    expect(activeWindows).toHaveLength(1);
    expect(activeWindows[0]?.id).toBe(COCKPIT_SECTION_ID);
  });

  it("scrolls the matching section element into view when its window is selected", () => {
    const sectionElement = document.createElement("div");
    sectionElement.id = SHOWCASE_SECTION_ID;
    document.body.appendChild(sectionElement);
    const scrollIntoView = vi.fn();
    sectionElement.scrollIntoView = scrollIntoView;

    const model = buildLandingStatusBarModel(HERO_SECTION_ID);
    const showcaseWindow = model.windows.find(
      (statusBarWindow) => statusBarWindow.id === SHOWCASE_SECTION_ID,
    );
    if (!showcaseWindow) {
      throw new Error("expected a window for the showcase section");
    }
    if (showcaseWindow.kind !== "action") {
      throw new Error("expected the showcase window to be an action window");
    }
    showcaseWindow.onSelect();

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
  });
});
