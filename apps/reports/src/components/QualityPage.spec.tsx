import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { QualityPage } from "./QualityPage";

afterEach(cleanup);

describe("QualityPage", () => {
  it("titles the canonical quality writeup", () => {
    render(<QualityPage />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "how agent quality is measured",
    );
  });

  it("renders all four testing pyramid tiers", () => {
    render(<QualityPage />);
    expect(screen.getByText(/Tier 3/)).toBeTruthy();
    expect(screen.getByText(/Tier 2/)).toBeTruthy();
    expect(screen.getByText(/Tier 1/)).toBeTruthy();
    expect(screen.getByText(/Tier 0/)).toBeTruthy();
  });

  it("links back to the reports hub and the live baseline dashboard", () => {
    render(<QualityPage />);
    const linkHrefs = screen
      .getAllByRole("link")
      .map((element) => element.getAttribute("href"));
    expect(linkHrefs).toContain("/engineering/dotfiles/reports/");
    expect(linkHrefs).toContain("/engineering/dotfiles/reports/baseline/");
  });

  it("keeps no employer name in the rendered public copy", () => {
    const { container } = render(<QualityPage />);
    expect(container.textContent?.toLowerCase()).not.toContain("betha");
  });
});
