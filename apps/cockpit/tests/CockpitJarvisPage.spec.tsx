import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CockpitJarvisPage } from "../src/pages/CockpitJarvisPage";

vi.mock("@platform/workspace", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@platform/workspace")>()),
  createBrowserSessionTerminalEmulator: () => ({
    attachTo: () => ({ columns: 80, rows: 24 }),
    writeOutputBytes: () => {},
    onOwnerInput: () => {},
    fitToContainer: () => ({ columns: 80, rows: 24 }),
    focus: () => {},
    dispose: () => {},
  }),
}));

class SilentWebSocket {
  static readonly OPEN = 1;
  readonly readyState = 0;
  addEventListener() {}
  removeEventListener() {}
  send() {}
  close() {}
}

beforeEach(() => {
  vi.stubGlobal("WebSocket", SilentWebSocket);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderJarvisPage() {
  render(<CockpitJarvisPage />);
}

describe("CockpitJarvisPage", () => {
  it("opens on the session terminal view by default", () => {
    renderJarvisPage();
    expect(
      screen.getByRole("region", { name: "Jarvis session terminal" }),
    ).toBeDefined();
  });

  it("renders without a cockpit session registry around it", () => {
    renderJarvisPage();
    expect(
      screen.queryByRole("navigation", { name: "Cockpit sessions" }),
    ).toBeNull();
  });

  it("switches to the conversation view with a message input for talking to Jarvis", () => {
    renderJarvisPage();
    fireEvent.click(screen.getByRole("tab", { name: "Conversation" }));
    expect(screen.getByLabelText("Message Jarvis")).toBeDefined();
    expect(
      screen.getByRole("region", { name: "Jarvis conversation" }),
    ).toBeDefined();
  });

  it("never answers on the agent's behalf while the reply is in flight", () => {
    renderJarvisPage();
    fireEvent.click(screen.getByRole("tab", { name: "Conversation" }));
    fireEvent.change(screen.getByLabelText("Message Jarvis"), {
      target: { value: "status report" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    const transcript = screen.getByRole("list", { name: "Jarvis transcript" });
    expect(transcript.textContent).not.toContain("Standing by");
    expect(transcript.querySelectorAll("li")).toHaveLength(1);
  });

  it("appends the owner message to the transcript and clears the input on send", () => {
    renderJarvisPage();
    fireEvent.click(screen.getByRole("tab", { name: "Conversation" }));
    const input = screen.getByLabelText("Message Jarvis") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "status report" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(screen.getByText("status report")).toBeDefined();
    expect(screen.getByText("Jarvis is thinking")).toBeDefined();
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
