import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import {
  CROSS_SECTION_NAVIGATION_ROUTES,
  OWNER_SIGN_IN_ENTRY_ROUTE,
} from "@platform/config";
import { LandingFooter } from "../src/landing/LandingFooter";

afterEach(cleanup);

describe("LandingFooter", () => {
  it("renders a registry-derived sitemap of every public route plus the owner entry and source", () => {
    render(<LandingFooter />);
    const linkHrefs = screen
      .getAllByRole("link")
      .map((element) => element.getAttribute("href"));
    for (const route of CROSS_SECTION_NAVIGATION_ROUTES) {
      expect(linkHrefs).toContain(route.mountPath);
    }
    expect(linkHrefs).toContain(OWNER_SIGN_IN_ENTRY_ROUTE.mountPath);
    expect(linkHrefs).toContain("https://github.com/Castrozan/lucaszanoni-web");
  });
});
