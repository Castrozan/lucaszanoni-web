import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CockpitJarvisPage } from "../src/pages/CockpitJarvisPage";

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

function renderJarvisPage() {
  render(<CockpitJarvisPage />);
}

describe("CockpitJarvisPage multi-machine routing", () => {
  it("hides the machine switcher when no machines are configured", () => {
    renderJarvisPage();
    fireEvent.click(screen.getByRole("tab", { name: "Terminal" }));
    expect(screen.queryByRole("navigation", { name: "Machines" })).toBeNull();
  });

  it("lists the configured machines and routes selection in the internal view", () => {
    vi.stubEnv(
      "VITE_COCKPIT_WORKSPACE_MACHINES",
      "chise:Chise:ws://machine-a.example/session,air:Air:ws://machine-b.example/session",
    );

    renderJarvisPage();
    fireEvent.click(screen.getByRole("tab", { name: "Terminal" }));

    expect(screen.getByRole("navigation", { name: "Machines" })).toBeDefined();
    expect(
      screen
        .getByRole("button", { name: "Chise" })
        .getAttribute("aria-current"),
    ).toBe("true");
    expect(
      screen.getByRole("button", { name: "Air" }).getAttribute("aria-current"),
    ).toBe("false");

    fireEvent.click(screen.getByRole("button", { name: "Air" }));

    expect(
      screen.getByRole("button", { name: "Air" }).getAttribute("aria-current"),
    ).toBe("true");
    expect(
      screen
        .getByRole("button", { name: "Chise" })
        .getAttribute("aria-current"),
    ).toBe("false");
  });
});
