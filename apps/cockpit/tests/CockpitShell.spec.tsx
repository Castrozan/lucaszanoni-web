import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "@platform/design-system";
import { CockpitShell } from "../src/layout/CockpitShell";
import { CockpitSessionsProvider } from "../src/sessions/cockpit-sessions-context";
import { createFakeStorage } from "./support/fake-web-storage";

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

function renderShell(initialEntries: readonly string[] = ["/"]) {
  render(
    <ThemeProvider>
      <CockpitSessionsProvider
        initialSessions={[{ key: "global", label: "Jarvis" }]}
        storage={createFakeStorage()}
      >
        <MemoryRouter initialEntries={[...initialEntries]}>
          <CockpitShell>
            <div>main content</div>
          </CockpitShell>
        </MemoryRouter>
      </CockpitSessionsProvider>
    </ThemeProvider>,
  );
}

describe("CockpitShell", () => {
  it("renders the routed content without the legacy left-rail navigation", () => {
    renderShell();
    expect(screen.getByText("main content")).toBeDefined();
    expect(
      screen.queryByRole("navigation", { name: "Cockpit navigation" }),
    ).toBeNull();
  });

  it("opens the command palette on the leader-then-k sequence", () => {
    renderShell();
    expect(
      screen.queryByRole("dialog", { name: "Command palette" }),
    ).toBeNull();
    fireEvent.keyDown(document.body, { key: "b", ctrlKey: true });
    fireEvent.keyDown(document.body, { key: "k" });
    expect(
      screen.getByRole("dialog", { name: "Command palette" }),
    ).toBeDefined();
  });

  it("exposes session-switch commands in the palette for fuzzy search", () => {
    renderShell();
    fireEvent.keyDown(document.body, { key: "b", ctrlKey: true });
    fireEvent.keyDown(document.body, { key: "k" });
    fireEvent.change(screen.getByRole("textbox", { name: "Search commands" }), {
      target: { value: "switch" },
    });
    expect(
      screen.getByRole("option", { name: "Switch to Jarvis" }),
    ).toBeDefined();
  });
});
