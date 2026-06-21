import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@platform/design-system";
import { CockpitDashboardPage } from "../src/pages/CockpitDashboardPage";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <CockpitDashboardPage />
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

describe("CockpitDashboardPage", () => {
  it("renders the owner quick-access links", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("not behind access in test");
      }),
    );
    renderDashboard();
    expect(screen.getByText("Claude usage")).toBeDefined();
    expect(screen.getByText("Reports")).toBeDefined();
  });

  it("shows a neutral welcome and renders no owner email before identity resolves", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );
    renderDashboard();
    expect(
      screen.getByRole("heading", { name: "Welcome back." }),
    ).toBeDefined();
    expect(document.body.textContent ?? "").not.toContain("@");
  });
});
