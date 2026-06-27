import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { SectionsGrid } from "../src/landing/SectionsGrid";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("SectionsGrid owner reveal", () => {
  it("keeps owner-gated tiles locked for an anonymous visitor", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 401 }),
    );
    render(<SectionsGrid />);
    await waitFor(() => {
      const usageTile = screen.getByRole("link", { name: /Claude usage/i });
      expect(usageTile.getAttribute("data-locked")).toBe("true");
    });
  });

  it("unlocks owner-gated tiles for a verified Cloudflare Access identity", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ email: "owner@example.com" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    render(<SectionsGrid />);
    await waitFor(() => {
      const usageTile = screen.getByRole("link", { name: "Claude usage" });
      expect(usageTile.getAttribute("data-locked")).toBe("false");
    });
  });
});
