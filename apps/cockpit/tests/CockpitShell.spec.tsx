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
  it("renders a left rail carrying the cockpit views and the owner bookmarks", () => {
    renderShell();
    expect(
      screen.getByRole("navigation", { name: "Cockpit navigation" }),
    ).toBeDefined();
    expect(screen.getByRole("link", { name: "User" })).toBeDefined();
    expect(screen.getByText("Claude usage")).toBeDefined();
    expect(screen.getByText("main content")).toBeDefined();
  });

  it("marks the active view with aria-current for keyboard switching", () => {
    renderShell(["/user"]);
    expect(
      screen.getByRole("link", { name: "User" }).getAttribute("aria-current"),
    ).toBe("page");
  });

  it("navigates to Jarvis on the leader-then-a sequence", () => {
    renderShell();
    expect(
      screen.getByRole("link", { name: "Jarvis" }).getAttribute("aria-current"),
    ).toBeNull();
    fireEvent.keyDown(document.body, { key: "b", ctrlKey: true });
    fireEvent.keyDown(document.body, { key: "a" });
    expect(
      screen.getByRole("link", { name: "Jarvis" }).getAttribute("aria-current"),
    ).toBe("page");
  });

  it("opens the command palette on the leader-then-k sequence when enabled", () => {
    vi.stubEnv("VITE_COCKPIT_COMMAND_PALETTE", "true");
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

  it("keeps the command palette unavailable while the flag is off", () => {
    vi.stubEnv("VITE_COCKPIT_COMMAND_PALETTE", "");
    renderShell();
    fireEvent.keyDown(document.body, { key: "b", ctrlKey: true });
    fireEvent.keyDown(document.body, { key: "k" });
    expect(
      screen.queryByRole("dialog", { name: "Command palette" }),
    ).toBeNull();
  });

  it("exposes session-switch commands in the palette for fuzzy search", () => {
    vi.stubEnv("VITE_COCKPIT_COMMAND_PALETTE", "true");
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
