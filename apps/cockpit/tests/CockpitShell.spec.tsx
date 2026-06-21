import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ThemeProvider } from "@platform/design-system";
import { CockpitShell } from "../src/layout/CockpitShell";

afterEach(cleanup);

describe("CockpitShell", () => {
  it("renders a left quick-access rail carrying the owner bookmarks", () => {
    render(
      <ThemeProvider>
        <CockpitShell>
          <div>main content</div>
        </CockpitShell>
      </ThemeProvider>,
    );
    expect(
      screen.getByRole("navigation", { name: "Quick access" }),
    ).toBeDefined();
    expect(screen.getByText("Claude usage")).toBeDefined();
    expect(screen.getByText("main content")).toBeDefined();
  });
});
