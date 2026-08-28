import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { StackLauncherPage } from "../src/launcher/StackLauncherPage";

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe("StackLauncherPage", () => {
  it("shows Cloudflare and Tailscale launch links on publicly exposed apps", () => {
    vi.stubEnv("VITE_ARR_STACK_PUBLIC_DOMAIN", "lucaszanoni.com");
    vi.stubEnv("VITE_ARR_STACK_TAILNET_HOST", "100.94.11.81");

    render(<StackLauncherPage />);

    expect(
      screen.getAllByRole("link", { name: /via Cloudflare/ }),
    ).toHaveLength(11);
    expect(screen.getAllByRole("link", { name: /via Tailscale/ })).toHaveLength(
      11,
    );

    expect(
      screen
        .getByRole("link", { name: "Jellyfin via Cloudflare" })
        .getAttribute("href"),
    ).toBe("https://watch.lucaszanoni.com");
    expect(
      screen
        .getByRole("link", { name: "Jellyfin via Tailscale" })
        .getAttribute("href"),
    ).toBe("http://100.94.11.81:8096");
    expect(
      screen
        .getByRole("link", { name: "Stremio via Cloudflare" })
        .getAttribute("href"),
    ).toBe("https://stream.lucaszanoni.com/setup");
    expect(
      screen
        .getByRole("link", { name: "Stremio via Tailscale" })
        .getAttribute("href"),
    ).toBe("http://100.94.11.81:43212/setup");
    expect(
      screen
        .getByRole("link", { name: "Miwayomi via Cloudflare" })
        .getAttribute("href"),
    ).toBe("https://anime.lucaszanoni.com");
    expect(
      screen
        .getByRole("link", { name: "qBittorrent via Cloudflare" })
        .getAttribute("href"),
    ).toBe("https://qbittorrent.lucaszanoni.com");
  });
});
