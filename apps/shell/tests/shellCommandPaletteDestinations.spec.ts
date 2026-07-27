import { describe, expect, it } from "vitest";
import { buildShellCommandPaletteDestinations } from "../src/landing/shellCommandPaletteDestinations";
import { LANDING_SECTIONS } from "../src/landing/landingSections";

describe("buildShellCommandPaletteDestinations", () => {
  it("adds the shell pages on top of the universal app destinations", () => {
    const hrefs = buildShellCommandPaletteDestinations().map(
      (destination) => destination.href,
    );
    expect(hrefs).toContain("/about");
    expect(hrefs).toContain("/catalog");
    expect(hrefs).toContain("/dynamic-ia-canvas/");
    expect(hrefs).toContain("/cockpit/");
  });

  it("offers paths only, leaving the landing sections to the status bar numbers", () => {
    const hrefs = buildShellCommandPaletteDestinations().map(
      (destination) => destination.href,
    );
    for (const section of LANDING_SECTIONS) {
      expect(hrefs).not.toContain(`/#${section.id}`);
    }
    expect(hrefs.filter((href) => href.includes("#"))).toEqual([]);
  });

  it("keeps a single home entry after merging with the universal set", () => {
    const homeEntries = buildShellCommandPaletteDestinations().filter(
      (destination) => destination.href === "/",
    );
    expect(homeEntries).toHaveLength(1);
  });

  it("has no duplicate hrefs", () => {
    const hrefs = buildShellCommandPaletteDestinations().map(
      (destination) => destination.href,
    );
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});
