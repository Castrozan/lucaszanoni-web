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
    setHostKeyGuard: () => {},
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

describe("CockpitJarvisPage multi-machine routing", () => {
  it("hides the machine switcher when no machines are configured", () => {
    renderJarvisPage();
    fireEvent.click(screen.getByRole("tab", { name: "Terminal" }));
    expect(
      screen.queryByRole("navigation", { name: "Cockpit machines" }),
    ).toBeNull();
  });

  it("lists the configured machines and routes selection in the internal view", () => {
    vi.stubEnv(
      "VITE_COCKPIT_MACHINES",
      "chise:Chise:ws://machine-a.example/session,air:Air:ws://machine-b.example/session",
    );

    renderJarvisPage();
    fireEvent.click(screen.getByRole("tab", { name: "Terminal" }));

    expect(
      screen.getByRole("navigation", { name: "Cockpit machines" }),
    ).toBeDefined();
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
