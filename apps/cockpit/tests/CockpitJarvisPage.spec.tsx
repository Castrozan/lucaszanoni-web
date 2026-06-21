import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CockpitJarvisPage } from "../src/pages/CockpitJarvisPage";

afterEach(cleanup);

describe("CockpitJarvisPage", () => {
  it("opens on the main view with a message input for talking to Jarvis", () => {
    render(<CockpitJarvisPage />);
    expect(screen.getByLabelText("Message Jarvis")).toBeDefined();
    expect(
      screen.getByRole("region", { name: "Jarvis conversation" }),
    ).toBeDefined();
  });

  it("switches to the internal session terminal view", () => {
    render(<CockpitJarvisPage />);
    fireEvent.click(screen.getByRole("tab", { name: "Internal" }));
    expect(
      screen.getByRole("region", { name: "Jarvis session terminal" }),
    ).toBeDefined();
  });

  it("appends the owner message to the transcript and clears the input on send", () => {
    render(<CockpitJarvisPage />);
    const input = screen.getByLabelText("Message Jarvis") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "status report" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(screen.getByText("status report")).toBeDefined();
    expect(screen.getByText("Standing by on: status report")).toBeDefined();
    expect(input.value).toBe("");
  });

  it("disables the voice control where speech recognition is unavailable", () => {
    render(<CockpitJarvisPage />);
    expect(
      (
        screen.getByRole("button", {
          name: "Toggle voice",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });
});
