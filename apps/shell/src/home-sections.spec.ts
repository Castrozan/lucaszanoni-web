import { describe, expect, it } from "vitest";
import { buildHomeSectionCards } from "./home-sections";

describe("buildHomeSectionCards", () => {
  it("creates one card per cross-section route in order", () => {
    const cards = buildHomeSectionCards();
    expect(cards.map((card) => card.id)).toEqual([
      "usage-dashboard",
      "reports",
    ]);
  });

  it("carries the mount path of each route as the card link", () => {
    const cards = buildHomeSectionCards();
    const usageCard = cards.find((card) => card.id === "usage-dashboard");
    expect(usageCard?.href).toBe("/engineering/dotfiles/claude/usage/");
  });
});
