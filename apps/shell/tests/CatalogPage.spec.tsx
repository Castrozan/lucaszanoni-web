import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CatalogPage } from "../src/pages/CatalogPage";

afterEach(cleanup);

function renderCatalog() {
  return render(
    <MemoryRouter>
      <CatalogPage />
    </MemoryRouter>,
  );
}

function tileHrefsByLockState(locked: boolean): (string | null)[] {
  return screen
    .getAllByRole("link")
    .filter((element) => element.getAttribute("data-locked") === String(locked))
    .map((element) => element.getAttribute("href"));
}

describe("CatalogPage", () => {
  it("gates the owner-only apps as locked tiles", () => {
    renderCatalog();
    const lockedHrefs = tileHrefsByLockState(true);
    expect(lockedHrefs).toContain("/engineering/dotfiles/claude/usage/");
    expect(lockedHrefs).toContain("/engineering/dotfiles/reports/");
  });

  it("keeps the public apps openable", () => {
    renderCatalog();
    const liveHrefs = tileHrefsByLockState(false);
    expect(liveHrefs).toContain("/dynamic-ia-canvas/");
    expect(liveHrefs).toContain("/dynamic-ia-interfaces/");
  });

  it("renders exactly one status bar", () => {
    renderCatalog();
    expect(
      screen.getAllByRole("contentinfo", { name: "Status bar" }),
    ).toHaveLength(1);
  });
});
