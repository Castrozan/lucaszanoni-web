import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import {
  BottomStatusBar,
  CommandPalette,
  KeybindProvider,
} from "@platform/design-system";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

function fireKey(init: KeyboardEventInit) {
  act(() => {
    window.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, ...init }),
    );
  });
}

function renderShellSurfaces() {
  render(
    <KeybindProvider>
      <CommandPalette navigate={() => {}} />
      <BottomStatusBar />
    </KeybindProvider>,
  );
}

describe("status bar keybinds", () => {
  it("registers the tmux nav bindings so they show in the help overlay", () => {
    renderShellSurfaces();
    fireKey({ key: "?" });
    expect(
      screen.getByRole("dialog", { name: "Keyboard shortcuts" }),
    ).toBeTruthy();
    for (const label of [
      "List sessions",
      "Next window",
      "Previous window",
      "Window 1",
    ]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });

  it("frees Leader p so it no longer opens the command palette", () => {
    renderShellSurfaces();
    fireKey({ key: "b", ctrlKey: true });
    fireKey({ key: "p" });
    expect(
      screen.queryByRole("dialog", { name: "Command palette" }),
    ).toBeNull();
    fireKey({ key: "k", metaKey: true });
    expect(
      screen.getByRole("dialog", { name: "Command palette" }),
    ).toBeTruthy();
  });
});
