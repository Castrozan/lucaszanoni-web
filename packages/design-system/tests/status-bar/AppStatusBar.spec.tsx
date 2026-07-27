import { afterEach, describe, expect, it } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { findMicroFrontendRoute } from "@platform/config";
import { AppStatusBar } from "../../src/status-bar/AppStatusBar";

afterEach(cleanup);

afterEach(() => {
  window.history.pushState({}, "", "/");
});

function getAboutButton() {
  const windowsNav = screen.getByRole("navigation", { name: "Windows" });
  return within(windowsNav).getByRole("button", { name: /:About$/ });
}

describe("AppStatusBar", () => {
  it("does not render the about panel before the about window is clicked", () => {
    render(<AppStatusBar appId="dynamic-ia-canvas" />);
    expect(
      screen.queryByRole("region", { name: "About Dynamic IA Canvas" }),
    ).toBeNull();
  });

  it("adds an about button to the windows nav", () => {
    render(<AppStatusBar appId="dynamic-ia-canvas" />);
    expect(getAboutButton()).toBeDefined();
  });

  it("reveals the about panel with the app's description and mount path when the about button is clicked", () => {
    render(<AppStatusBar appId="dynamic-ia-canvas" />);
    fireEvent.click(getAboutButton());

    const aboutPanel = screen.getByRole("region", {
      name: "About Dynamic IA Canvas",
    });
    const route = findMicroFrontendRoute("dynamic-ia-canvas");
    expect(within(aboutPanel).getByText(route.description)).toBeDefined();
    expect(within(aboutPanel).getByText(route.mountPath)).toBeDefined();
    expect(within(aboutPanel).getByText("Public")).toBeDefined();
  });

  it("closes the about panel again when Escape is pressed", () => {
    render(<AppStatusBar appId="dynamic-ia-canvas" />);
    fireEvent.click(getAboutButton());
    expect(
      screen.getByRole("region", { name: "About Dynamic IA Canvas" }),
    ).toBeDefined();

    fireEvent(
      window,
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );

    expect(
      screen.queryByRole("region", { name: "About Dynamic IA Canvas" }),
    ).toBeNull();
  });

  it("renders the current app's own window as a button and closes the about panel when it is clicked", () => {
    window.history.pushState(
      {},
      "",
      findMicroFrontendRoute("dynamic-ia-canvas").mountPath,
    );
    render(<AppStatusBar appId="dynamic-ia-canvas" />);
    fireEvent.click(getAboutButton());
    expect(
      screen.getByRole("region", { name: "About Dynamic IA Canvas" }),
    ).toBeDefined();

    const windowsNav = screen.getByRole("navigation", { name: "Windows" });
    const currentAppWindowButton = within(windowsNav).getByRole("button", {
      name: /:Dynamic IA Canvas$/,
    });
    expect(currentAppWindowButton.tagName).toBe("BUTTON");

    fireEvent.click(currentAppWindowButton);
    expect(
      screen.queryByRole("region", { name: "About Dynamic IA Canvas" }),
    ).toBeNull();
  });

  it("renders no keybind hint text since navigation keybinds are not registered and no KeybindProvider is in scope", () => {
    render(<AppStatusBar appId="dynamic-ia-canvas" />);
    expect(screen.queryByText(/help/i)).toBeNull();
  });
});
