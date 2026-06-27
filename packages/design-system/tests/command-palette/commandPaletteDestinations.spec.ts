import { describe, expect, it } from "vitest";
import { buildCommandPaletteDestinations } from "../../src/command-palette/commandPaletteDestinations";

describe("buildCommandPaletteDestinations", () => {
  it("includes in-page sections, shell pages, and registry apps", () => {
    const hrefs = buildCommandPaletteDestinations().map(
      (destination) => destination.href,
    );
    expect(hrefs).toContain("/");
    expect(hrefs).toContain("/#sections");
    expect(hrefs).toContain("/about");
    expect(hrefs).toContain("/catalog");
    expect(hrefs).toContain("/dynamic-ia-canvas/");
    expect(hrefs).toContain("/cockpit/");
  });

  it("deduplicates destinations by href", () => {
    const hrefs = buildCommandPaletteDestinations().map(
      (destination) => destination.href,
    );
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("does not list the shell itself as an app", () => {
    const ids = buildCommandPaletteDestinations().map(
      (destination) => destination.id,
    );
    expect(ids).not.toContain("app-shell");
  });
});
