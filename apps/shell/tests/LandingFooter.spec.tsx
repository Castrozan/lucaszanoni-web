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

  it("centres its own inner container so it lines up on every page", () => {
    const { container } = render(<LandingFooter />);
    const innerContainer = container.querySelector("footer > div");
    if (!innerContainer) {
      throw new Error("expected the footer to have an inner container");
    }
    expect(innerContainer.classList.contains("mx-auto")).toBe(true);
    expect(innerContainer.classList.contains("max-w-[1400px]")).toBe(true);
  });

  it("links each in-page item to its landing section anchor", () => {
    render(<LandingFooter />);
    const linkHrefs = screen
      .getAllByRole("link")
      .map((element) => element.getAttribute("href"));
    expect(linkHrefs).toContain("/#cockpit");
    expect(linkHrefs).toContain("/#showcase");
    expect(linkHrefs).toContain("/#about");
  });
});
