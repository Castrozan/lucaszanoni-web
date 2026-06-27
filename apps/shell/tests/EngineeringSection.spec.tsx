import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MICRO_FRONTEND_ROUTES } from "@platform/config";
import { engineeringContent } from "../src/landing/landingContent";
import { EngineeringSection } from "../src/landing/EngineeringSection";

afterEach(cleanup);

function escapeForRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

describe("EngineeringSection", () => {
  it("renders the registry as a live table with a row per app", () => {
    render(<EngineeringSection />);
    for (const route of MICRO_FRONTEND_ROUTES) {
      expect(screen.getByText(route.id)).toBeTruthy();
    }
  });

  it("links each narrative card to its source artifact", () => {
    render(<EngineeringSection />);
    for (const card of engineeringContent.narrativeCards) {
      const evidenceLink = screen.getByRole("link", {
        name: new RegExp(escapeForRegExp(card.evidenceLabel), "i"),
      });
      expect(evidenceLink.getAttribute("href")).toBe(card.evidenceHref);
    }
  });
});
