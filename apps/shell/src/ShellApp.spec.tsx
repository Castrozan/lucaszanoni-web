import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ShellApp } from "./ShellApp";

afterEach(cleanup);

describe("ShellApp", () => {
  it("mounts the design-system chrome with a primary heading", () => {
    render(<ShellApp />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "Lucas Zanoni",
    );
  });

  it("links to every cross-section mount path", () => {
    render(<ShellApp />);
    const linkHrefs = screen
      .getAllByRole("link")
      .map((element) => element.getAttribute("href"));
    expect(linkHrefs).toContain("/engineering/dotfiles/claude/usage/");
    expect(linkHrefs).toContain("/engineering/dotfiles/reports/");
  });

  it("exposes the theme toggle from the shell chrome", () => {
    render(<ShellApp />);
    expect(screen.getByRole("button", { name: /mode/i })).toBeTruthy();
  });
});
