import { describe, expect, it } from "vitest";
import { buildCommandPaletteDestinations } from "../../src/command-palette/commandPaletteDestinations";

describe("buildCommandPaletteDestinations", () => {
  it("includes the platform home, registry apps, and the source", () => {
    const hrefs = buildCommandPaletteDestinations().map(
      (destination) => destination.href,
    );
    expect(hrefs).toContain("/");
    expect(hrefs).toContain("/dynamic-ia-canvas/");
    expect(hrefs).toContain("/cockpit/");
    expect(hrefs).toContain("https://github.com/Castrozan/lucaszanoni-web");
  });

  it("stays generic and omits shell-specific sections and pages", () => {
    const hrefs = buildCommandPaletteDestinations().map(
      (destination) => destination.href,
    );
    expect(hrefs).not.toContain("/#sections");
    expect(hrefs).not.toContain("/about");
    expect(hrefs).not.toContain("/catalog");
  });

  it("deduplicates destinations by href and excludes the shell as an app", () => {
    const destinations = buildCommandPaletteDestinations();
    const hrefs = destinations.map((destination) => destination.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(destinations.map((destination) => destination.id)).not.toContain(
      "app-shell",
    );
  });
});
