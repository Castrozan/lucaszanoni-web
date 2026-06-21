import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ShellApp } from "../src/ShellApp";

afterEach(cleanup);

describe("ShellApp", () => {
  it("renders the brand wordmark in the landing chrome", () => {
    render(<ShellApp />);
    expect(screen.getAllByText("LUCASZANONI").length).toBeGreaterThan(0);
  });

  it("renders the static first line of the hero headline", () => {
    render(<ShellApp />);
    expect(screen.getByText("ONE EDGE.")).toBeTruthy();
  });

  it("links to every cross-section mount path", () => {
    render(<ShellApp />);
    const linkHrefs = screen
      .getAllByRole("link")
      .map((element) => element.getAttribute("href"));
    expect(linkHrefs).toContain("/engineering/dotfiles/claude/usage/");
    expect(linkHrefs).toContain("/engineering/dotfiles/reports/");
  });

  it("hints the roadmap features as inert preview controls", () => {
    render(<ShellApp />);
    expect(screen.getByText("Command palette")).toBeTruthy();
    expect(screen.getAllByText("SOON").length).toBeGreaterThan(0);
  });
});
