import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { CockpitSessionPage } from "../../src/pages/CockpitSessionPage";

vi.mock("@platform/workspace", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@platform/workspace")>()),
  createBrowserSessionTerminalEmulator: () => ({
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

function renderSessionPage() {
  render(<CockpitSessionPage />);
}

describe("CockpitSessionPage GitHub review pairing", () => {
  it("shows the review pairing empty-state prompt when no GitHub repository is configured", () => {
    renderSessionPage();
    expect(
      screen.getByRole("region", { name: "GitHub review pairing" }),
    ).toBeDefined();
    expect(
      screen.getByText(/configure the GitHub repository for this machine/i),
    ).toBeDefined();
    expect(
      screen.queryByRole("link", { name: "Open pull request review" }),
    ).toBeNull();
  });

  it("renders enabled review deep-links on the main branch by default when only the repository is configured", () => {
    vi.stubEnv("VITE_COCKPIT_REPOSITORY_URL", "https://github.com/example/app");

    renderSessionPage();

    expect(
      (
        screen.getByRole("link", {
          name: "Open pull request review",
        }) as HTMLAnchorElement
      ).getAttribute("href"),
    ).toBe(
      "https://github.com/example/app/pulls?q=is%3Apr+is%3Aopen+head%3Amain",
    );
  });

  it("deep-links the configured GitHub repository in the internal view", () => {
    vi.stubEnv("VITE_COCKPIT_REPOSITORY_URL", "https://github.com/example/app");
    vi.stubEnv("VITE_COCKPIT_REVIEW_BRANCH", "feature/login");

    renderSessionPage();

    expect(
      screen.getByRole("region", { name: "GitHub review pairing" }),
    ).toBeDefined();
    expect(
      (
        screen.getByRole("link", {
          name: "Open pull request review",
        }) as HTMLAnchorElement
      ).getAttribute("href"),
    ).toBe(
      "https://github.com/example/app/pulls?q=is%3Apr+is%3Aopen+head%3Afeature%2Flogin",
    );
  });
});
