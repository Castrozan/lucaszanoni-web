import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CommandPalette } from "../../src/command-palette/CommandPalette";
import type {
  CommandPaletteController,
  PaletteCommand,
} from "../../src/command-palette/useCommandPalette";
import { KeybindProvider } from "../../src/keybinds/KeybindProvider";

afterEach(cleanup);

const sampleResults: PaletteCommand[] = [
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

function renderPalette(controller: CommandPaletteController) {
  return render(
    <KeybindProvider>
      <CommandPalette controller={controller} />
    </KeybindProvider>,
  );
}

describe("CommandPalette", () => {
  it("renders nothing while the palette is closed", () => {
    renderPalette(buildController({ open: false }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders the search input and one option per result when open", () => {
    renderPalette(buildController());
    expect(
      screen.getByRole("dialog", { name: "Command palette" }),
    ).toBeDefined();
    expect(screen.getAllByRole("option")).toHaveLength(2);
    expect(screen.getByRole("option", { name: "Go to Jarvis" })).toBeDefined();
  });

  it("forwards typed text to setQuery", () => {
    const controller = buildController();
    renderPalette(controller);
    fireEvent.change(screen.getByRole("textbox", { name: "Search commands" }), {
      target: { value: "jar" },
    });
    expect(controller.setQuery).toHaveBeenCalledWith("jar");
  });

  it("moves the selection on the arrow keys", () => {
    const controller = buildController();
    renderPalette(controller);
    const input = screen.getByRole("textbox", { name: "Search commands" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(controller.moveSelection).toHaveBeenCalledWith(1);
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(controller.moveSelection).toHaveBeenCalledWith(-1);
  });

  it("runs the selected command on Enter", () => {
    const controller = buildController();
    renderPalette(controller);
    fireEvent.keyDown(
      screen.getByRole("textbox", { name: "Search commands" }),
      { key: "Enter" },
    );
    expect(controller.runSelected).toHaveBeenCalledOnce();
  });

  it("closes on Escape", () => {
    const controller = buildController();
    renderPalette(controller);
    fireEvent.keyDown(
      screen.getByRole("textbox", { name: "Search commands" }),
      { key: "Escape" },
    );
    expect(controller.closePalette).toHaveBeenCalledOnce();
  });

  it("marks the selected option for assistive technology", () => {
    renderPalette(buildController({ selectedIndex: 1 }));
    expect(
      screen
        .getByRole("option", { name: "Go to Jarvis" })
        .getAttribute("aria-selected"),
    ).toBe("true");
  });

  it("runs a command when its option is clicked", () => {
    const controller = buildController();
    renderPalette(controller);
    fireEvent.click(screen.getByRole("option", { name: "Go to Jarvis" }));
    expect(controller.runCommand).toHaveBeenCalledWith("view:jarvis");
  });

  it("shows an empty-state message when no command matches", () => {
    renderPalette(buildController({ results: [], query: "zzz" }));
    expect(screen.queryByRole("option")).toBeNull();
    expect(screen.getByText("No matching commands")).toBeDefined();
  });

  it("scrolls the highlighted option into view when the selection changes", () => {
    const scrollIntoView = vi.fn();
    const original = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = scrollIntoView;
    renderPalette(buildController({ selectedIndex: 1 }));
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest" });
    Element.prototype.scrollIntoView = original;
  });

  it("highlights an option on hover only after a real pointer move", () => {
    const controller = buildController({ selectedIndex: 0 });
    renderPalette(controller);
    const jarvisOption = screen.getByRole("option", { name: "Go to Jarvis" });

    fireEvent.mouseEnter(jarvisOption);
    expect(controller.moveSelection).not.toHaveBeenCalled();

    fireEvent.mouseMove(screen.getByRole("listbox"));
    fireEvent.mouseEnter(jarvisOption);
    expect(controller.moveSelection).toHaveBeenCalledWith(1);
  });

  it("self-manages from a commands list and opens on the open event", () => {
    const run = vi.fn();
    render(
      <KeybindProvider>
        <CommandPalette commands={[{ id: "go", title: "Go somewhere", run }]} />
      </KeybindProvider>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent(window, new Event("atrium:command-palette"));
    expect(screen.getByRole("option", { name: "Go somewhere" })).toBeDefined();
  });
});
