import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CommandPalette } from "../../src/command-palette/CommandPalette";
import { KeybindProvider } from "../../src/keybinds/KeybindProvider";

afterEach(cleanup);

describe("useDismissOnEscapeKey", () => {
  it("closes the command palette on Escape even when focus has moved off the search input", () => {
    const run = vi.fn();
    render(
      <KeybindProvider>
        <CommandPalette commands={[{ id: "go", title: "Go somewhere", run }]} />
      </KeybindProvider>,
    );

    fireEvent(window, new Event("atrium:command-palette"));
    expect(screen.getByRole("dialog")).toBeDefined();

    document.body.focus();

    fireEvent(
      window,
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );

    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
