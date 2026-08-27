import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, within } from "@testing-library/react";
import { StackLauncherRoot } from "../src/StackLauncherRoot";

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  window.localStorage.clear();
  window.history.pushState({}, "", "/");
});

function fireKey(init: KeyboardEventInit) {
  act(() => {
    window.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, ...init }),
    );
  });
}

describe("StackLauncherRoot", () => {
  it("adds every configured Cloudflare and Tailscale launch option to the status bar", () => {
    vi.stubEnv("VITE_ARR_STACK_PUBLIC_DOMAIN", "lucaszanoni.com");
    vi.stubEnv("VITE_ARR_STACK_TAILNET_HOST", "100.94.11.81");
    window.history.pushState({}, "", "/stack/");

    render(<StackLauncherRoot />);

    const statusBar = screen.getByRole("contentinfo", { name: "Status bar" });
    const windows = within(statusBar).getByRole("navigation", {
      name: "Windows",
    });
    expect(within(windows).getAllByRole("link")).toHaveLength(16);
    expect(
      within(windows)
        .getByRole("link", { name: "1:Stack" })
        .getAttribute("href"),
    ).toBe("/stack/");
    expect(
      within(windows)
        .getByRole("link", { name: "2:Jellyfin Cloudflare" })
        .getAttribute("href"),
    ).toBe("https://watch.lucaszanoni.com");
    expect(
      within(windows)
        .getByRole("link", { name: "3:Jellyfin Tailscale" })
        .getAttribute("href"),
    ).toBe("http://100.94.11.81:8096");
    expect(
      within(windows)
        .getByRole("link", { name: "16:qBittorrent Tailscale" })
        .getAttribute("href"),
    ).toBe("http://100.94.11.81:8080");
  });

  it("opens the platform session picker with Leader s", () => {
    window.history.pushState({}, "", "/stack/");

    render(<StackLauncherRoot />);

    fireKey({ key: "b", ctrlKey: true });
    fireKey({ key: "s" });

    expect(
      screen.getByRole("dialog", { name: "Command palette" }),
    ).toBeTruthy();
  });
});
