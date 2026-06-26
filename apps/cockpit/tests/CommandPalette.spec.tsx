import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CommandPalette } from "../src/command-palette/CommandPalette";
import type {
  CockpitCommand,
  CommandPaletteController,
} from "../src/command-palette/use-command-palette";

afterEach(cleanup);

const sampleResults: CockpitCommand[] = [
  { id: "view:dashboard", title: "Go to Dashboard", run: vi.fn() },
  { id: "view:jarvis", title: "Go to Jarvis", run: vi.fn() },
];

function buildController(
  overrides: Partial<CommandPaletteController> = {},
): CommandPaletteController {
  return {
    open: true,
    query: "",
    selectedIndex: 0,
    results: sampleResults,
    openPalette: vi.fn(),
    closePalette: vi.fn(),
    setQuery: vi.fn(),
    moveSelection: vi.fn(),
    runSelected: vi.fn(),
    runCommand: vi.fn(),
    ...overrides,
  };
}

describe("CommandPalette", () => {
  it("renders nothing while the palette is closed", () => {
    const controller = buildController({ open: false });
    render(<CommandPalette controller={controller} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders the search input and one option per result when open", () => {
    render(<CommandPalette controller={buildController()} />);
    expect(
      screen.getByRole("dialog", { name: "Command palette" }),
    ).toBeDefined();
    expect(screen.getAllByRole("option")).toHaveLength(2);
    expect(screen.getByRole("option", { name: "Go to Jarvis" })).toBeDefined();
  });

  it("forwards typed text to setQuery", () => {
    const controller = buildController();
    render(<CommandPalette controller={controller} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Search commands" }), {
      target: { value: "jar" },
    });
    expect(controller.setQuery).toHaveBeenCalledWith("jar");
  });

  it("moves the selection on the arrow keys", () => {
    const controller = buildController();
    render(<CommandPalette controller={controller} />);
    const input = screen.getByRole("textbox", { name: "Search commands" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(controller.moveSelection).toHaveBeenCalledWith(1);
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(controller.moveSelection).toHaveBeenCalledWith(-1);
  });

  it("runs the selected command on Enter", () => {
    const controller = buildController();
    render(<CommandPalette controller={controller} />);
    fireEvent.keyDown(
      screen.getByRole("textbox", { name: "Search commands" }),
      { key: "Enter" },
    );
    expect(controller.runSelected).toHaveBeenCalledOnce();
  });

  it("closes on Escape", () => {
    const controller = buildController();
    render(<CommandPalette controller={controller} />);
    fireEvent.keyDown(
      screen.getByRole("textbox", { name: "Search commands" }),
      { key: "Escape" },
    );
    expect(controller.closePalette).toHaveBeenCalledOnce();
  });

  it("marks the selected option for assistive technology", () => {
    const controller = buildController({ selectedIndex: 1 });
    render(<CommandPalette controller={controller} />);
    expect(
      screen
        .getByRole("option", { name: "Go to Jarvis" })
        .getAttribute("aria-selected"),
    ).toBe("true");
  });

  it("runs a command when its option is clicked", () => {
    const controller = buildController();
    render(<CommandPalette controller={controller} />);
    fireEvent.click(screen.getByRole("option", { name: "Go to Jarvis" }));
    expect(controller.runCommand).toHaveBeenCalledWith("view:jarvis");
  });

  it("shows an empty-state message when no command matches", () => {
    const controller = buildController({ results: [], query: "zzz" });
    render(<CommandPalette controller={controller} />);
    expect(screen.queryByRole("option")).toBeNull();
    expect(screen.getByText("No matching commands")).toBeDefined();
  });
});
