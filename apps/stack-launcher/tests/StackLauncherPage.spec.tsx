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
      screen
        .getByRole("link", { name: "Audiobookshelf via Cloudflare" })
        .getAttribute("href"),
    ).toBe("https://audiobookshelf.lucaszanoni.com");
    expect(
      screen
        .getByRole("link", { name: "Audiobookshelf via Tailscale" })
        .getAttribute("href"),
    ).toBe("http://100.94.11.81:13378");

    expect(
      screen
        .getByRole("link", { name: "ReadMeABook via Tailscale" })
        .getAttribute("href"),
    ).toBe("http://100.94.11.81:3030");
    expect(
      screen.queryByRole("link", { name: "ReadMeABook via Cloudflare" }),
    ).toBeTruthy();

    expect(
      screen.getAllByRole("link", { name: /via Cloudflare/ }),
    ).toHaveLength(6);
    expect(screen.getAllByRole("link", { name: /via Tailscale/ })).toHaveLength(
      6,
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
    ).toBe("https://stream.lucaszanoni.com");
    expect(
      screen
        .getByRole("link", { name: "Stremio via Tailscale" })
        .getAttribute("href"),
    ).toBe("http://100.94.11.81:43212");
    expect(
      screen.queryAllByRole("link", {
        name: /(?:Radarr|Sonarr|Prowlarr|Bazarr|qBittorrent|Miwayomi) via/,
      }),
    ).toHaveLength(0);
  });
});
