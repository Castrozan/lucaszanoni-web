import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ReportsHubPage } from "../../src/components/ReportsHubPage";

afterEach(cleanup);

describe("ReportsHubPage", () => {
  it("renders a card linking to each report destination", () => {
    render(<ReportsHubPage />);
    const linkHrefs = screen
      .getAllByRole("link")
      .map((element) => element.getAttribute("href"));
    expect(linkHrefs).toContain("/engineering/dotfiles/reports/baseline/");
    expect(linkHrefs).toContain("/engineering/dotfiles/reports/quality/");
    expect(linkHrefs).toContain("/engineering/dotfiles/reports/coverage/");
    expect(linkHrefs).toContain("/engineering/dotfiles/claude/usage/");
  });

  it("names the quality writeup card", () => {
    render(<ReportsHubPage />);
    expect(screen.getByText("how quality is measured")).toBeTruthy();
  });
});
