import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@platform/design-system";
import { CockpitRoutes } from "../src/CockpitRoutes";

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
        <MemoryRouter initialEntries={[path]}>
          <CockpitRoutes />
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

describe("CockpitRoutes", () => {
  it("lands the cockpit index on the owner dashboard instead of a terminal", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );
    renderAtPath("/");
    expect(screen.getByRole("heading", { name: /Welcome back/ })).toBeDefined();
    expect(
      screen.queryByRole("heading", { name: "Agent terminal" }),
    ).toBeNull();
    expect(
      screen.queryByRole("region", { name: "Jarvis session terminal" }),
    ).toBeNull();
  });

  it("keeps the Jarvis terminal reachable at /jarvis", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );
    renderAtPath("/jarvis");
    expect(
      screen.getByRole("region", { name: "Jarvis session terminal" }),
    ).toBeDefined();
  });

  it("serves the private documentation surface at /docs", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );
    renderAtPath("/docs");
    expect(
      screen.getByRole("heading", { name: "System documentation" }),
    ).toBeDefined();
  });

  it("never falls the terminal route back to the workspace launcher", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );
    renderAtPath("/terminal");
    expect(
      screen.queryByRole("heading", { name: "Agent terminal" }),
    ).toBeNull();
  });

  it("falls back unknown cockpit paths to the owner dashboard", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );
    renderAtPath("/does-not-exist");
    expect(screen.getByRole("heading", { name: /Welcome back/ })).toBeDefined();
  });
});
