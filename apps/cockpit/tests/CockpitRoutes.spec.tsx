import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@platform/design-system";
import { CockpitRoutes } from "../src/CockpitRoutes";
import { CockpitSessionsProvider } from "../src/sessions/cockpit-sessions-context";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function renderAtPath(path: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <CockpitSessionsProvider>
          <MemoryRouter initialEntries={[path]}>
            <CockpitRoutes />
          </MemoryRouter>
        </CockpitSessionsProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

describe("CockpitRoutes", () => {
  it("lands the cockpit index on the Jarvis terminal instead of the dashboard hub", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );
    renderAtPath("/");
    expect(
      screen.getByRole("region", { name: "Jarvis session terminal" }),
    ).toBeDefined();
    expect(screen.queryByRole("heading", { name: /Welcome back/ })).toBeNull();
  });

  it("keeps the dashboard hub reachable at /dashboard", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );
    renderAtPath("/dashboard");
    expect(screen.getByRole("heading", { name: /Welcome back/ })).toBeDefined();
  });

  it("falls back unknown cockpit paths to the Jarvis terminal", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );
    renderAtPath("/does-not-exist");
    expect(
      screen.getByRole("region", { name: "Jarvis session terminal" }),
    ).toBeDefined();
  });
});
