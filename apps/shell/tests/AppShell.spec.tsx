import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { AppShell, ThemeProvider } from "@platform/design-system";
import { CROSS_SECTION_NAVIGATION_ROUTES } from "@platform/config";

afterEach(cleanup);

describe("AppShell", () => {
  it("renders the primary cross-section navigation the status-bar rollout must preserve", () => {
    render(
      <ThemeProvider>
        <AppShell activeRouteId="reports">
          <div>body</div>
        </AppShell>
      </ThemeProvider>,
    );

    expect(screen.getByRole("navigation", { name: "Primary" })).toBeTruthy();
    expect(screen.getByText("lucaszanoni.com").getAttribute("href")).toBe("/");
    for (const route of CROSS_SECTION_NAVIGATION_ROUTES) {
      expect(screen.getByText(route.navigationLabel).getAttribute("href")).toBe(
        route.mountPath,
      );
    }
  });
});
