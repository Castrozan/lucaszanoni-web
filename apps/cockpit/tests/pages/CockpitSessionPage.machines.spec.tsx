import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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

vi.mock("../../src/terminal/CockpitSessionTerminal", () => ({
  CockpitSessionTerminal: ({ endpoint }: { endpoint?: string | null }) => (
    <output aria-label="Session endpoint">{endpoint}</output>
  ),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

function renderSessionPage() {
  render(<CockpitSessionPage />);
}

describe("CockpitSessionPage multi-machine routing", () => {
  it("hides the machine switcher when no machines are configured", () => {
    renderSessionPage();
    expect(screen.queryByRole("navigation", { name: "Machines" })).toBeNull();
  });

  it("lists the configured machines and routes selection in the internal view", () => {
    vi.stubEnv(
      "VITE_COCKPIT_WORKSPACE_MACHINES",
      "chise:Chise:ws://machine-a.example/cockpit/lifecycle,air:Air:ws://machine-b.example/cockpit/lifecycle",
    );

    renderSessionPage();

    expect(screen.getByRole("navigation", { name: "Machines" })).toBeDefined();
    expect(
      screen
        .getByRole("button", { name: "Chise" })
        .getAttribute("aria-current"),
    ).toBe("true");
    expect(
      screen.getByRole("button", { name: "Air" }).getAttribute("aria-current"),
    ).toBe("false");

    expect(screen.getByLabelText("Session endpoint").textContent).toBe(
      "ws://machine-a.example/cockpit/terminal-session/",
    );

    fireEvent.click(screen.getByRole("button", { name: "Air" }));

    expect(
      screen.getByRole("button", { name: "Air" }).getAttribute("aria-current"),
    ).toBe("true");
    expect(
      screen
        .getByRole("button", { name: "Chise" })
        .getAttribute("aria-current"),
    ).toBe("false");
    expect(screen.getByLabelText("Session endpoint").textContent).toBe(
      "ws://machine-b.example/cockpit/terminal-session/",
    );
  });
});
