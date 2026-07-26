import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { KeyboardNavigationSection } from "../src/landing/KeyboardNavigationSection";

afterEach(cleanup);

describe("KeyboardNavigationSection", () => {
  it("shows the Ctrl+B then S binding for jumping to any app", () => {
    render(<KeyboardNavigationSection />);
    expect(screen.getByText("Ctrl+B then S")).toBeTruthy();
  });

  it("shows the Ctrl+B then 1-4 binding for switching section", () => {
    render(<KeyboardNavigationSection />);
    expect(screen.getByText("Ctrl+B then 1-4")).toBeTruthy();
  });

  it("shows the ? binding for seeing every shortcut", () => {
    render(<KeyboardNavigationSection />);
    expect(screen.getByText("?")).toBeTruthy();
  });
});
