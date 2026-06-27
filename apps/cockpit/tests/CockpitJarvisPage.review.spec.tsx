import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CockpitJarvisPage } from "../src/pages/CockpitJarvisPage";
import { CockpitSessionsProvider } from "../src/sessions/cockpit-sessions-context";
import { createFakeStorage } from "./support/fake-web-storage";

vi.mock("../src/jarvis/browser-terminal-emulator", () => ({
  createBrowserTerminalEmulator: () => ({
    attachTo: () => ({ columns: 80, rows: 24 }),
    writeOutputBytes: () => {},
    onOwnerInput: () => {},
    fitToContainer: () => ({ columns: 80, rows: 24 }),
    focus: () => {},
    dispose: () => {},
  }),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

function renderJarvisPage() {
  render(
    <CockpitSessionsProvider
      initialSessions={[{ key: "global", label: "Jarvis" }]}
      storage={createFakeStorage()}
    >
      <CockpitJarvisPage />
    </CockpitSessionsProvider>,
  );
}

describe("CockpitJarvisPage GitLab review pairing", () => {
  it("shows the review pairing empty-state prompt when no GitLab host is configured", () => {
    renderJarvisPage();
    fireEvent.click(screen.getByRole("tab", { name: "Terminal" }));
    expect(
      screen.getByRole("region", { name: "GitLab review pairing" }),
    ).toBeDefined();
    expect(
      screen.getByText(/configure the GitLab host for this machine/i),
    ).toBeDefined();
    expect(
      screen.queryByRole("link", { name: "Open merge request review" }),
    ).toBeNull();
  });

  it("renders enabled review deep-links on the main branch by default when only the host and project are configured", () => {
    vi.stubEnv("VITE_COCKPIT_GITLAB_BASE_URL", "https://gitlab.example.com");
    vi.stubEnv("VITE_COCKPIT_GITLAB_PROJECT", "group/app");

    renderJarvisPage();
    fireEvent.click(screen.getByRole("tab", { name: "Terminal" }));

    expect(
      (
        screen.getByRole("link", {
          name: "Open merge request review",
        }) as HTMLAnchorElement
      ).getAttribute("href"),
    ).toBe(
      "https://gitlab.example.com/group/app/-/merge_requests?scope=all&state=opened&source_branch=main",
    );
  });

  it("deep-links the configured GitLab host in the internal view", () => {
    vi.stubEnv("VITE_COCKPIT_GITLAB_BASE_URL", "https://gitlab.example.com");
    vi.stubEnv("VITE_COCKPIT_GITLAB_PROJECT", "group/app");
    vi.stubEnv("VITE_COCKPIT_GITLAB_BRANCH", "feature/login");

    renderJarvisPage();
    fireEvent.click(screen.getByRole("tab", { name: "Terminal" }));

    expect(
      screen.getByRole("region", { name: "GitLab review pairing" }),
    ).toBeDefined();
    expect(
      (
        screen.getByRole("link", {
          name: "Open merge request review",
        }) as HTMLAnchorElement
      ).getAttribute("href"),
    ).toBe(
      "https://gitlab.example.com/group/app/-/merge_requests?scope=all&state=opened&source_branch=feature%2Flogin",
    );
  });
});
