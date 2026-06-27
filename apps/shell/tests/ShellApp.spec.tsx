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

  it("teases opted-in private apps as locked tiles and keeps public apps live", () => {
    render(<ShellApp />);
    const tiles = screen
      .getAllByRole("link")
      .filter((element) => element.hasAttribute("data-locked"));
    const lockedHrefs = tiles
      .filter((element) => element.getAttribute("data-locked") === "true")
      .map((element) => element.getAttribute("href"));
    const liveHrefs = tiles
      .filter((element) => element.getAttribute("data-locked") === "false")
      .map((element) => element.getAttribute("href"));
    expect(lockedHrefs).toContain("/engineering/dotfiles/claude/usage/");
    expect(lockedHrefs).toContain("/engineering/dotfiles/reports/");
    expect(liveHrefs).toContain("/dynamic-ia-canvas/");
    expect(liveHrefs).toContain("/dynamic-ia-interfaces/");
  });

  it("exposes the command palette trigger and an honest shipped/planned roadmap", () => {
    render(<ShellApp />);
    expect(
      screen.getByRole("button", { name: "Open command palette" }),
    ).toBeTruthy();
    expect(screen.getByText("Keyboard navigation")).toBeTruthy();
    expect(screen.getAllByText("Shipped").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Planned").length).toBeGreaterThan(0);
  });
});
