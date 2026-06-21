import { afterEach, describe, expect, it } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { JarvisSessionTerminal } from "../src/jarvis/JarvisSessionTerminal";
import type {
  JarvisSessionSocket,
  JarvisSessionSocketFactory,
  JarvisSessionSocketHandlers,
} from "../src/jarvis/use-jarvis-session-terminal";

afterEach(cleanup);

interface FakeSocketControl {
  factory: JarvisSessionSocketFactory;
  handlers: JarvisSessionSocketHandlers | null;
  sent: string[];
  closed: boolean;
}

function createFakeSocketControl(): FakeSocketControl {
  const control: FakeSocketControl = {
    handlers: null,
    sent: [],
    closed: false,
    factory: (_endpoint, handlers) => {
      control.handlers = handlers;
      const socket: JarvisSessionSocket = {
        send: (payload) => control.sent.push(payload),
        close: () => {
          control.closed = true;
          handlers.onClose("closed by client");
        },
      };
      return socket;
    },
  };
  return control;
}

describe("JarvisSessionTerminal", () => {
  it("shows a configuration notice and no connect control without an endpoint", () => {
    render(<JarvisSessionTerminal endpoint={null} />);
    expect(screen.getByText(/VITE_JARVIS_SESSION_WS_URL/)).toBeDefined();
    expect(screen.queryByRole("button", { name: "Connect" })).toBeNull();
  });

  it("keeps the session terminal region label for the internal view", () => {
    render(<JarvisSessionTerminal endpoint={null} />);
    expect(
      screen.getByRole("region", { name: "Jarvis session terminal" }),
    ).toBeDefined();
  });

  it("connects, streams agent output, and echoes owner input over the socket", () => {
    const control = createFakeSocketControl();
    render(
      <JarvisSessionTerminal
        endpoint="ws://localhost:9999/session"
        createSocket={control.factory}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Connect" }));
    expect(control.handlers).not.toBeNull();

    act(() => control.handlers?.onOpen());
    expect(screen.getByText("session open")).toBeDefined();

    act(() => control.handlers?.onMessage("hello from [32mjarvis[0m\n"));
    expect(screen.getByText("hello from jarvis")).toBeDefined();

    const input = screen.getByLabelText(
      "Send to Jarvis session",
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "status" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(control.sent).toContain("status\n");
    expect(screen.getByText("status")).toBeDefined();
    expect(input.value).toBe("");
  });

  it("disconnects and reflects the closed status", () => {
    const control = createFakeSocketControl();
    render(
      <JarvisSessionTerminal
        endpoint="ws://localhost:9999/session"
        createSocket={control.factory}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Connect" }));
    act(() => control.handlers?.onOpen());
    fireEvent.click(screen.getByRole("button", { name: "Disconnect" }));

    expect(control.closed).toBe(true);
    expect(screen.getByText(/session closed/)).toBeDefined();
  });
});
