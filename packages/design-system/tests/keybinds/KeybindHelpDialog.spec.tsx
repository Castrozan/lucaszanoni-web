import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { KeybindHelpDialog } from "../../src/keybinds/KeybindHelpDialog";
import type { KeybindContextValue } from "../../src/keybinds/keybindContext";
import type { KeybindBindingView } from "../../src/keybinds/keybindViews";

afterEach(cleanup);

function buildBindingView(
  overrides: Partial<KeybindBindingView> = {},
): KeybindBindingView {
  return {
    id: "palette.open",
    label: "Open palette",
    defaultBinding: "Leader p",
    currentBinding: "Leader p",
    isOverridden: false,
    ...overrides,
  };
}

function buildRegistry(
  overrides: Partial<KeybindContextValue> = {},
): KeybindContextValue {
  return {
    register: vi.fn(() => () => {}),
    bindings: [
      buildBindingView({
        id: "jarvis.jump",
        label: "Jump to Jarvis",
        defaultBinding: "Leader j",
        currentBinding: "Leader j",
      }),
      buildBindingView({
        id: "palette.open",
        label: "Open palette",
        defaultBinding: "Leader p",
        currentBinding: "Leader p",
      }),
      buildBindingView({
        id: "help.toggle",
        label: "Toggle help",
        defaultBinding: "?",
        currentBinding: "?",
      }),
    ],
    leader: "Control+b",
    isSequencePending: false,
    setOverride: vi.fn(),
    resetOverride: vi.fn(),
    setLeader: vi.fn(),
    ...overrides,
  };
}

describe("KeybindHelpDialog", () => {
  it("exposes the search input under the accessible name Search shortcuts", () => {
    render(<KeybindHelpDialog registry={buildRegistry()} />);
    expect(screen.getByLabelText("Search shortcuts")).toBeDefined();
  });

  it("renders every binding sorted by label when the search is empty", () => {
    render(<KeybindHelpDialog registry={buildRegistry()} />);
    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(3);
    expect(rows[0]?.textContent?.includes("Jump to Jarvis")).toBeTruthy();
    expect(rows[1]?.textContent?.includes("Open palette")).toBeTruthy();
    expect(rows[2]?.textContent?.includes("Toggle help")).toBeTruthy();
  });

  it("filters the visible rows as the user types into the search input", () => {
    render(<KeybindHelpDialog registry={buildRegistry()} />);
    const input = screen.getByLabelText("Search shortcuts");
    fireEvent.change(input, { target: { value: "jarvis" } });
    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(1);
    expect(rows[0]?.textContent?.includes("Jump to Jarvis")).toBeTruthy();
  });

  it("shows no binding rows and an empty-state message for a query that matches nothing", () => {
    render(<KeybindHelpDialog registry={buildRegistry()} />);
    const input = screen.getByLabelText("Search shortcuts");
    fireEvent.change(input, { target: { value: "zzz" } });
    expect(screen.getByText("No matching shortcuts")).toBeDefined();
    expect(screen.queryByText("Jump to Jarvis")).toBeNull();
    expect(screen.queryByText("Open palette")).toBeNull();
    expect(screen.queryByText("Toggle help")).toBeNull();
  });

  it("moves the highlight to the second row on ArrowDown from the search input", () => {
    render(<KeybindHelpDialog registry={buildRegistry()} />);
    const input = screen.getByLabelText("Search shortcuts");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    const rows = screen.getAllByRole("listitem");
    expect(rows[0]?.getAttribute("aria-current")).toBeNull();
    expect(rows[1]?.getAttribute("aria-current")).toBe("true");
    expect(rows[2]?.getAttribute("aria-current")).toBeNull();
  });

  it("wraps the highlight to the last row on ArrowUp from the first row", () => {
    render(<KeybindHelpDialog registry={buildRegistry()} />);
    const input = screen.getByLabelText("Search shortcuts");
    fireEvent.keyDown(input, { key: "ArrowUp" });
    const rows = screen.getAllByRole("listitem");
    expect(rows[2]?.getAttribute("aria-current")).toBe("true");
    expect(rows[0]?.getAttribute("aria-current")).toBeNull();
  });

  it("wraps the highlight over the filtered rows rather than over every binding", () => {
    render(<KeybindHelpDialog registry={buildRegistry()} />);
    const input = screen.getByLabelText("Search shortcuts");
    fireEvent.change(input, { target: { value: "leader" } });
    expect(screen.getAllByRole("listitem")).toHaveLength(2);

    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    const rows = screen.getAllByRole("listitem");
    expect(rows[0]?.getAttribute("aria-current")).toBe("true");
    expect(rows[1]?.getAttribute("aria-current")).toBeNull();
  });

  it("jumps the highlight to the first row on Home and the last row on End", () => {
    render(<KeybindHelpDialog registry={buildRegistry()} />);
    const input = screen.getByLabelText("Search shortcuts");
    fireEvent.keyDown(input, { key: "ArrowDown" });

    fireEvent.keyDown(input, { key: "End" });
    const rowsAtEnd = screen.getAllByRole("listitem");
    expect(rowsAtEnd[2]?.getAttribute("aria-current")).toBe("true");

    fireEvent.keyDown(input, { key: "Home" });
    const rowsAtHome = screen.getAllByRole("listitem");
    expect(rowsAtHome[0]?.getAttribute("aria-current")).toBe("true");
  });
});
