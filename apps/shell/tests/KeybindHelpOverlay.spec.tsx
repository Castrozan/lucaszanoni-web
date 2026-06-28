import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { CommandPalette, KeybindProvider } from "@platform/design-system";

afterEach(cleanup);

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
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "?" }));
    });
    expect(
      screen.getByRole("dialog", { name: "Keyboard shortcuts" }),
    ).toBeTruthy();
    expect(screen.getByText("Toggle command palette")).toBeTruthy();
    expect(screen.getByText("Show keyboard shortcuts")).toBeTruthy();
  });
});
