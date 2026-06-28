import { afterEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import {
  CommandPalette,
  buildCommandPaletteDestinations,
} from "@platform/design-system";
import { buildShellCommandPaletteDestinations } from "../src/landing/shellCommandPaletteDestinations";

afterEach(cleanup);

function pressOpenShortcut() {
  act(() => {
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true }),
    );
  });
}

describe("CommandPalette", () => {
  it("stays closed until the keyboard shortcut opens it", () => {
    render(<CommandPalette navigate={() => {}} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    pressOpenShortcut();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("lists the shell sections, pages, and apps it is given", () => {
    render(
      <CommandPalette
        destinations={buildShellCommandPaletteDestinations()}
        navigate={() => {}}
      />,
    );
    pressOpenShortcut();
    for (const label of [
      "Sections",
      "Showcase",
      "About page",
      "Catalog",
      "Dynamic IA Canvas",
      "Cockpit",
    ]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });

  it("filters destinations by the typed query", () => {
    render(<CommandPalette navigate={() => {}} />);
    pressOpenShortcut();
    fireEvent.change(screen.getByLabelText("Search sections"), {
      target: { value: "interfaces" },
    });
    expect(screen.getByText("Dynamic IA Interfaces")).toBeTruthy();
    expect(screen.queryByText("Dynamic IA Canvas")).toBeNull();
  });

  it("navigates to the highlighted destination on enter", () => {
    const firstDestination = buildCommandPaletteDestinations()[0];
    if (!firstDestination) {
      throw new Error("expected at least one palette destination");
    }
    const navigate = vi.fn();
    render(<CommandPalette navigate={navigate} />);
    pressOpenShortcut();
    fireEvent.keyDown(screen.getByLabelText("Search sections"), {
      key: "Enter",
    });
    expect(navigate).toHaveBeenCalledWith(firstDestination.href);
  });

  it("closes on escape", () => {
    render(<CommandPalette navigate={() => {}} />);
    pressOpenShortcut();
    fireEvent.keyDown(screen.getByLabelText("Search sections"), {
      key: "Escape",
    });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
