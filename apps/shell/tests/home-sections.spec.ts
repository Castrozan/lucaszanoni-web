import { describe, expect, it } from "vitest";
import { buildCatalogCards } from "../src/home-sections";

describe("buildCatalogCards", () => {
  it("lists every micro-frontend except the shell itself", () => {
    const ids = buildCatalogCards().map((card) => card.id);
    expect(ids).not.toContain("shell");
    expect(ids).toContain("dynamic-ia-canvas");
    expect(ids).toContain("dynamic-ia-interfaces");
    expect(ids).toContain("cockpit");
  });

  it("carries the mount path of each route as the card link", () => {
    for (const card of buildCatalogCards()) {
      expect(card.href.startsWith("/")).toBe(true);
    }
  });

  it("renders the public ai apps as unlocked, ai-powered, dynamic tiles", () => {
    const cards = buildCatalogCards();
    for (const id of ["dynamic-ia-canvas", "dynamic-ia-interfaces"]) {
      const card = cards.find((candidate) => candidate.id === id);
      expect(card?.locked).toBe(false);
      expect(card?.accessEnvironment).toBe("public");
      expect(card?.isAiPowered).toBe(true);
      expect(card?.buildProfile).toBe("dynamic-service");
    }
  });

  it("locks the owner-gated dotfiles apps and the cockpit", () => {
    const cards = buildCatalogCards();
    for (const id of ["usage-dashboard", "reports", "cockpit"]) {
      const card = cards.find((candidate) => candidate.id === id);
      expect(card?.locked).toBe(true);
      expect(card?.accessEnvironment).toBe("private");
    }
  });
});
