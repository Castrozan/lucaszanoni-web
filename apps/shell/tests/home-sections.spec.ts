import { describe, expect, it } from "vitest";
import { NAVIGATION_TEASE_ROUTES } from "@platform/config";
import { buildHomeSectionCards } from "../src/home-sections";

describe("buildHomeSectionCards", () => {
  it("creates one card per opted-in navigation route in order", () => {
    expect(buildHomeSectionCards().map((card) => card.id)).toEqual(
      NAVIGATION_TEASE_ROUTES.map((route) => route.id),
    );
  });

  it("carries the mount path of each route as the card link", () => {
    const cards = buildHomeSectionCards();
    for (const route of NAVIGATION_TEASE_ROUTES) {
      const card = cards.find((candidate) => candidate.id === route.id);
      expect(card?.href).toBe(route.mountPath);
    }
  });

  it("renders the public ai apps as unlocked, ai-powered, dynamic tiles", () => {
    const cards = buildHomeSectionCards();
    for (const id of ["dynamic-ia-canvas", "dynamic-ia-interfaces"]) {
      const card = cards.find((candidate) => candidate.id === id);
      expect(card?.locked).toBe(false);
      expect(card?.accessEnvironment).toBe("public");
      expect(card?.isAiPowered).toBe(true);
      expect(card?.buildProfile).toBe("dynamic-service");
    }
  });

  it("teases the opted-in private dotfiles apps as locked tiles", () => {
    const cards = buildHomeSectionCards();
    for (const id of ["usage-dashboard", "reports"]) {
      const card = cards.find((candidate) => candidate.id === id);
      expect(card?.locked).toBe(true);
      expect(card?.accessEnvironment).toBe("private");
      expect(card?.isAiPowered).toBe(false);
    }
  });

  it("hides apps opted out of cross-section navigation", () => {
    const cardIds = buildHomeSectionCards().map((card) => card.id);
    expect(cardIds).not.toContain("db");
    expect(cardIds).not.toContain("jarvis-session");
    expect(cardIds).not.toContain("cockpit");
    expect(cardIds).not.toContain("shell");
  });
});
