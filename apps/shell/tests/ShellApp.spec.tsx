import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import {
  CROSS_SECTION_NAVIGATION_ROUTES,
  OWNER_SIGN_IN_ENTRY_ROUTE,
} from "@platform/config";
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

  it("links to every publicly visible cross-section mount path", () => {
    render(<ShellApp />);
    const linkHrefs = screen
      .getAllByRole("link")
      .map((element) => element.getAttribute("href"));
    for (const route of CROSS_SECTION_NAVIGATION_ROUTES) {
      expect(linkHrefs).toContain(route.mountPath);
    }
  });

  it("routes the header ENTER button to the gated owner sign-in entry", () => {
    render(<ShellApp />);
    const enterDoor = screen.getByRole("link", { name: "ENTER" });
    expect(enterDoor.getAttribute("href")).toBe(
      OWNER_SIGN_IN_ENTRY_ROUTE.mountPath,
    );
  });

  it("keeps the usage dashboard off the public landing", () => {
    render(<ShellApp />);
    const linkHrefs = screen
      .getAllByRole("link")
      .map((element) => element.getAttribute("href"));
    expect(linkHrefs).not.toContain("/engineering/dotfiles/claude/usage/");
  });

  it("hints the roadmap features as inert preview controls", () => {
    render(<ShellApp />);
    expect(screen.getByText("Command palette")).toBeTruthy();
    expect(screen.getAllByText("SOON").length).toBeGreaterThan(0);
  });
});
