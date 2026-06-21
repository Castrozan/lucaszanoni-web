import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { CROSS_SECTION_NAVIGATION_ROUTES } from "@platform/config";
import { ShellApp } from "../src/ShellApp";

afterEach(cleanup);

describe("ShellApp", () => {
  it("mounts the design-system chrome with a primary heading", () => {
    render(<ShellApp />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "Lucas Zanoni",
    );
  });

  it("links to every publicly visible cross-section mount path and omits the gated ones", () => {
    render(<ShellApp />);
    const linkHrefs = screen
      .getAllByRole("link")
      .map((element) => element.getAttribute("href"));
    for (const route of CROSS_SECTION_NAVIGATION_ROUTES) {
      expect(linkHrefs).toContain(route.mountPath);
    }
    expect(linkHrefs).not.toContain("/engineering/dotfiles/claude/usage/");
    expect(linkHrefs).not.toContain("/engineering/dotfiles/reports/");
  });

  it("exposes the theme toggle from the shell chrome", () => {
    render(<ShellApp />);
    expect(screen.getByRole("button", { name: /mode/i })).toBeTruthy();
  });
});
