import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { BottomStatusBar } from "@platform/design-system";

afterEach(cleanup);

describe("BottomStatusBar", () => {
  it("always renders the active session and its windows", () => {
    render(<BottomStatusBar />);
    expect(
      screen.getByRole("contentinfo", { name: "Status bar" }),
    ).toBeTruthy();
    expect(screen.getByText("Home")).toBeTruthy();
    expect(screen.getByText("1:Home").getAttribute("href")).toBe("/");
  });
});
