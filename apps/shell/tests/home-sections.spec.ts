import { describe, expect, it } from "vitest";
import { CROSS_SECTION_NAVIGATION_ROUTES } from "@platform/config";
import { buildHomeSectionCards } from "../src/home-sections";

describe("buildHomeSectionCards", () => {
  it("creates one card per publicly visible cross-section route in order", () => {
    expect(buildHomeSectionCards().map((card) => card.id)).toEqual(
      CROSS_SECTION_NAVIGATION_ROUTES.map((route) => route.id),
    );
  });

  it("carries the mount path of each route as the card link", () => {
    const cards = buildHomeSectionCards();
    for (const route of CROSS_SECTION_NAVIGATION_ROUTES) {
      const card = cards.find((candidate) => candidate.id === route.id);
      expect(card?.href).toBe(route.mountPath);
    }
  });

  it("omits the gated dotfiles apps from the public home", () => {
    const cardIds = buildHomeSectionCards().map((card) => card.id);
    expect(cardIds).not.toContain("usage-dashboard");
    expect(cardIds).not.toContain("reports");
  });
});
