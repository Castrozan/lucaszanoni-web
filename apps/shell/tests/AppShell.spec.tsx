import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { AppShell } from "@platform/design-system";

afterEach(cleanup);

describe("AppShell", () => {
  it("renders content and the status bar without the legacy cross-section header", () => {
    render(
      <AppShell activeRouteId="reports">
        <p>report body</p>
      </AppShell>,
    );

    expect(screen.getByText("report body")).toBeTruthy();
    expect(
      screen.getByRole("contentinfo", { name: "Status bar" }),
    ).toBeTruthy();
    expect(screen.queryByRole("navigation", { name: "Primary" })).toBeNull();
    expect(screen.queryByRole("navigation", { name: "Breadcrumb" })).toBeNull();
  });
});
