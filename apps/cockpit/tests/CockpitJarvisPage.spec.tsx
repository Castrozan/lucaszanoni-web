import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CockpitJarvisPage } from "../src/pages/CockpitJarvisPage";
import { CockpitSessionsProvider } from "../src/sessions/cockpit-sessions-context";
import { createFakeStorage } from "./support/fake-web-storage";

vi.mock("../src/jarvis/browser-terminal-emulator", () => ({
  createBrowserTerminalEmulator: () => ({
    attachTo: () => ({ columns: 80, rows: 24 }),
    writeOutputBytes: () => {},
    onOwnerInput: () => {},
    fitToContainer: () => ({ columns: 80, rows: 24 }),
    focus: () => {},
    dispose: () => {},
  }),
}));

afterEach(cleanup);

function renderJarvisPage() {
  render(
    <CockpitSessionsProvider
      initialSessions={[{ key: "global", label: "Jarvis" }]}
      storage={createFakeStorage()}
    >
      <CockpitJarvisPage />
    </CockpitSessionsProvider>,
  );
}

describe("CockpitJarvisPage", () => {
  it("opens on the main view with a message input for talking to Jarvis", () => {
    renderJarvisPage();
    expect(screen.getByLabelText("Message Jarvis")).toBeDefined();
    expect(
      screen.getByRole("region", { name: "Jarvis conversation" }),
    ).toBeDefined();
  });

  it("switches to the internal session terminal view", () => {
    renderJarvisPage();
    fireEvent.click(screen.getByRole("tab", { name: "Internal" }));
    expect(
      screen.getByRole("region", { name: "Jarvis session terminal" }),
    ).toBeDefined();
  });

  it("appends the owner message to the transcript and clears the input on send", () => {
    renderJarvisPage();
    const input = screen.getByLabelText("Message Jarvis") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "status report" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(screen.getByText("status report")).toBeDefined();
    expect(screen.getByText("Standing by on: status report")).toBeDefined();
    expect(input.value).toBe("");
  });

  it("disables the voice control where speech recognition is unavailable", () => {
    renderJarvisPage();
    expect(
      (
        screen.getByRole("button", {
          name: "Toggle voice",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });
});
