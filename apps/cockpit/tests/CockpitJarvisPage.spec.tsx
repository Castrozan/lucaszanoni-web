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
    setHostKeyGuard: () => {},
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
  it("opens on the session terminal view by default", () => {
    renderJarvisPage();
    expect(
      screen.getByRole("region", { name: "Jarvis session terminal" }),
    ).toBeDefined();
  });

  it("switches to the conversation view with a message input for talking to Jarvis", () => {
    renderJarvisPage();
    fireEvent.click(screen.getByRole("tab", { name: "Conversation" }));
    expect(screen.getByLabelText("Message Jarvis")).toBeDefined();
    expect(
      screen.getByRole("region", { name: "Jarvis conversation" }),
    ).toBeDefined();
  });

  it("appends the owner message to the transcript and clears the input on send", () => {
    renderJarvisPage();
    fireEvent.click(screen.getByRole("tab", { name: "Conversation" }));
    const input = screen.getByLabelText("Message Jarvis") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "status report" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(screen.getByText("status report")).toBeDefined();
    expect(screen.getByText("Standing by on: status report")).toBeDefined();
    expect(input.value).toBe("");
  });

  it("disables the voice control where speech recognition is unavailable", () => {
    renderJarvisPage();
    fireEvent.click(screen.getByRole("tab", { name: "Conversation" }));
    expect(
      (
        screen.getByRole("button", {
          name: "Toggle voice",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });
});
