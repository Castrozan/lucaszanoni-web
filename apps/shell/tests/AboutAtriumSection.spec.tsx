import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AboutAtriumSection } from "../src/landing/AboutAtriumSection";
import { ABOUT_SECTION_ID } from "../src/landing/landingSections";

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

  it("anchors itself on the id the status bar jumps to", () => {
    const { container } = renderSection();
    expect(container.querySelector(`#${ABOUT_SECTION_ID}`)).toBeTruthy();
  });

  it("no longer counts the registry at the reader", () => {
    renderSection();
    expect(screen.queryByText("MICRO-FRONTENDS")).toBeNull();
    expect(screen.queryByText("AI-POWERED")).toBeNull();
    expect(screen.queryByText(/served from cloudflare edge/i)).toBeNull();
  });

  it("links to the about page via the more button", () => {
    renderSection();
    expect(
      screen
        .getByRole("link", { name: /more about the atrium/i })
        .getAttribute("href"),
    ).toBe("/about");
  });
});
