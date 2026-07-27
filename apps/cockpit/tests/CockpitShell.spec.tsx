import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { KeybindProvider, ThemeProvider } from "@platform/design-system";
import { CockpitShell } from "../src/layout/CockpitShell";

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

function renderShell(initialEntries: readonly string[] = ["/"]) {
  render(
    <ThemeProvider>
      <KeybindProvider>
        <MemoryRouter initialEntries={[...initialEntries]}>
          <CockpitShell>
            <div>main content</div>
          </CockpitShell>
        </MemoryRouter>
      </KeybindProvider>
    </ThemeProvider>,
  );
}

function openCommandPalette() {
  fireEvent.keyDown(document.body, { key: "b", ctrlKey: true });
  fireEvent.keyDown(document.body, { key: "k" });
}

function searchPalette(query: string) {
  fireEvent.change(screen.getByRole("textbox", { name: "Search commands" }), {
    target: { value: query },
  });
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
    openCommandPalette();
    expect(
      screen.getByRole("dialog", { name: "Command palette" }),
    ).toBeDefined();
  });

  it("exposes route navigation in the palette for fuzzy search", () => {
    renderShell();
    openCommandPalette();
    searchPalette("jarvis");
    expect(screen.getByRole("option", { name: /Go to Jarvis/ })).toBeDefined();
  });

  it("offers no session-switch command while no live workspace is attached", () => {
    renderShell();
    openCommandPalette();
    searchPalette("switch");
    expect(screen.queryByRole("option", { name: /^Switch to / })).toBeNull();
  });
});
