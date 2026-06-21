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
});
