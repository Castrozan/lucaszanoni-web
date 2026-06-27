import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AboutAtriumSection } from "../src/landing/AboutAtriumSection";

afterEach(cleanup);

function renderSection() {
  return render(
    <MemoryRouter>
      <AboutAtriumSection />
    </MemoryRouter>,
  );
}

describe("AboutAtriumSection", () => {
  it("renders the merged about-atrium heading and platform feature trio", () => {
    renderSection();
    expect(screen.getByRole("heading", { name: "ABOUT ATRIUM" })).toBeTruthy();
    expect(screen.getByText("SINGLE EDGE")).toBeTruthy();
  });

  it("shows the registry-derived platform stats", () => {
    renderSection();
    expect(screen.getByText("MICRO-FRONTENDS")).toBeTruthy();
    expect(screen.getByText("AI-POWERED")).toBeTruthy();
  });

  it("links to the about page via the more button", () => {
    renderSection();
    expect(
      screen
        .getByRole("link", { name: /more about the platform/i })
        .getAttribute("href"),
    ).toBe("/about");
  });
});
