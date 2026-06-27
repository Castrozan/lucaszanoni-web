import { afterEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { CROSS_SECTION_NAVIGATION_ROUTES } from "@platform/config";
import { CommandPalette } from "../src/landing/CommandPalette";

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

  it("lists every public cross-section route when open", () => {
    render(<CommandPalette navigate={() => {}} />);
    pressOpenShortcut();
    for (const route of CROSS_SECTION_NAVIGATION_ROUTES) {
      expect(screen.getByText(route.navigationLabel)).toBeTruthy();
    }
  });

  it("filters routes by the typed query", () => {
    render(<CommandPalette navigate={() => {}} />);
    pressOpenShortcut();
    fireEvent.change(screen.getByLabelText("Search sections"), {
      target: { value: "interfaces" },
    });
    expect(screen.getByText("Dynamic IA Interfaces")).toBeTruthy();
    expect(screen.queryByText("Dynamic IA Canvas")).toBeNull();
  });

  it("navigates to the highlighted route on enter", () => {
    const firstRoute = CROSS_SECTION_NAVIGATION_ROUTES[0];
    if (!firstRoute) {
      throw new Error("expected at least one public cross-section route");
    }
    const navigate = vi.fn();
    render(<CommandPalette navigate={navigate} />);
    pressOpenShortcut();
    fireEvent.keyDown(screen.getByLabelText("Search sections"), {
      key: "Enter",
    });
    expect(navigate).toHaveBeenCalledWith(firstRoute.mountPath);
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
