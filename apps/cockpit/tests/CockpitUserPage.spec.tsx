import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ThemeProvider } from "@platform/design-system";
import { CockpitUserPage } from "../src/pages/CockpitUserPage";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("CockpitUserPage", () => {
  it("renders the runtime Access identity once it resolves", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ email: "owner@example.com", name: "Owner" }),
      })),
    );
    render(
      <ThemeProvider>
        <CockpitUserPage />
      </ThemeProvider>,
    );
    expect(await screen.findByText("owner@example.com")).toBeDefined();
    expect(screen.getByText("Owner")).toBeDefined();
  });

  it("renders no owner PII before identity resolves", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );
    render(
      <ThemeProvider>
        <CockpitUserPage />
      </ThemeProvider>,
    );
    expect(document.body.textContent ?? "").not.toContain("@");
  });

  it("offers a logout action that clears the Cloudflare Access session", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );
    render(
      <ThemeProvider>
        <CockpitUserPage />
      </ThemeProvider>,
    );
    const logoutLink = screen.getByRole("link", { name: "Log out" });
    expect(logoutLink.getAttribute("href")).toBe("/cdn-cgi/access/logout");
  });
});
