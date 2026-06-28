import { afterEach, describe, expect, it } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { CommandPalette, KeybindProvider } from "@platform/design-system";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

function openOverlay() {
  act(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "?" }));
  });
}

describe("KeybindHelpOverlay", () => {
  it("opens on ? and lists registered shortcuts with their keys", () => {
    render(
      <KeybindProvider>
        <CommandPalette navigate={() => {}} />
      </KeybindProvider>,
    );
    expect(
      screen.queryByRole("dialog", { name: "Keyboard shortcuts" }),
    ).toBeNull();
    openOverlay();
    expect(
      screen.getByRole("dialog", { name: "Keyboard shortcuts" }),
    ).toBeTruthy();
    expect(screen.getByText("Toggle command palette")).toBeTruthy();
    expect(screen.getByText("Show keyboard shortcuts")).toBeTruthy();
  });

  it("rebinds an action via captured keys and persists it", () => {
    render(
      <KeybindProvider>
        <CommandPalette navigate={() => {}} />
      </KeybindProvider>,
    );
    openOverlay();
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));

    const row = screen.getByText("Toggle command palette").closest("li");
    if (!row) {
      throw new Error("expected a row for the toggle action");
    }
    fireEvent.click(within(row).getByText("Rebind"));
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "j", ctrlKey: true }),
      );
    });
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    });

    expect(within(row).getByText("(custom)")).toBeTruthy();
    expect(within(row).getByText("Ctrl+J")).toBeTruthy();
    expect(window.localStorage.getItem("atrium.keybinds.overrides")).toContain(
      "command-palette.toggle",
    );
  });
});
