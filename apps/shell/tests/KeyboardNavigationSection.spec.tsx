import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { KeyboardNavigationSection } from "../src/landing/KeyboardNavigationSection";
import { LANDING_SECTIONS } from "../src/landing/landingSections";

afterEach(cleanup);

describe("KeyboardNavigationSection", () => {
  it("shows the Ctrl+B then S binding for jumping to any app", () => {
    render(<KeyboardNavigationSection />);
    expect(screen.getByText("Ctrl+B then S")).toBeTruthy();
  });

  it("shows a numbered binding covering every landing section", () => {
    render(<KeyboardNavigationSection />);
    expect(
      screen.getByText(`Ctrl+B then 1-${LANDING_SECTIONS.length}`),
    ).toBeTruthy();
  });

  it("shows the ? binding for seeing every shortcut", () => {
    render(<KeyboardNavigationSection />);
    expect(screen.getByText("?")).toBeTruthy();
  });

  it("warns that keyboard interceptors have to be disabled or rebound", () => {
    render(<KeyboardNavigationSection />);
    expect(screen.getByText(/Vimium/)).toBeTruthy();
  });
});
