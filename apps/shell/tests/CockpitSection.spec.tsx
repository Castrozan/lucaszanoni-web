import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { CockpitSection } from "../src/landing/CockpitSection";
import { COCKPIT_SECTION_ID } from "../src/landing/landingSections";

afterEach(cleanup);

describe("CockpitSection", () => {
  it("sells the cockpit on what it is, what it is for, and how to use it", () => {
    render(<CockpitSection />);
    expect(screen.getByRole("heading", { name: "WHAT IT IS" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "WHAT IT IS FOR" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "HOW TO USE IT" })).toBeTruthy();
  });

  it("anchors itself on the id the status bar jumps to", () => {
    const { container } = render(<CockpitSection />);
    expect(container.querySelector(`#${COCKPIT_SECTION_ID}`)).toBeTruthy();
  });

  it("renders the one-line install call to action for driving your own machine", () => {
    render(<CockpitSection />);
    expect(
      screen.getByText(
        "curl -fsSL https://lucaszanoni.com/cockpit/local-cockpit.py | python3 -",
      ),
    ).toBeTruthy();
  });
});
