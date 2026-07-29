import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@platform/design-system";
import { CockpitDashboardPage } from "../src/pages/CockpitDashboardPage";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const machineSnapshot = {
  account_label: "personal",
  machine_label: "kira",
  schema_version: 1,
  model_usage_totals: {
    "claude-opus-5": {
      input_tokens: 1_000_000,
      output_tokens: 500_000,
      cache_read_input_tokens: 10_000_000,
      cache_creation_input_tokens: 500_000,
      cost_usd: 128,
    },
  },
  daily_model_tokens: [
    { date: "2026-07-27", tokens_by_model: { "claude-opus-5": 400_000 } },
    { date: "2026-07-28", tokens_by_model: { "claude-opus-5": 2_500_000 } },
  ],
  stats_first_session_date: "2026-01-04",
  stats_last_computed_date: "2026-07-28",
};

function stubSnapshotFetch() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => [machineSnapshot],
      text: async () => JSON.stringify([machineSnapshot]),
    })),
  );
}

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MemoryRouter>
          <CockpitDashboardPage />
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

function orderOfLandmarks(): readonly string[] {
  return [...document.querySelectorAll("section[aria-label]")].map(
    (section) => section.getAttribute("aria-label") ?? "",
  );
}

describe("the dashboard opens on the numbers, not on the links", () => {
  it("puts the headline figures above the chart and the quick access", async () => {
    stubSnapshotFetch();
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByLabelText("Key figures")).toBeTruthy();
    });
    const landmarks = orderOfLandmarks();
    expect(landmarks.indexOf("Key figures")).toBeLessThan(
      landmarks.indexOf("Usage over time"),
    );
    expect(landmarks.indexOf("Usage over time")).toBeLessThan(
      landmarks.indexOf("Quick access"),
    );
  });

  it("reads the figures off the single aggregate request", async () => {
    stubSnapshotFetch();
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("$128.00")).toBeTruthy();
    });
    expect(screen.getByText("Latest day")).toBeTruthy();
    expect(screen.getByText("2.5M")).toBeTruthy();
    expect(screen.getByText("12M")).toBeTruthy();
    const snapshotRequests = vi
      .mocked(globalThis.fetch)
      .mock.calls.filter(([requestUrl]) =>
        String(requestUrl).includes("storage.googleapis.com"),
      );
    expect(snapshotRequests).toHaveLength(1);
  });

  it("keeps the page usable when the live feed is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("not behind access in test");
      }),
    );
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("live feed unavailable")).toBeTruthy();
    });
    expect(screen.getByText("Claude usage")).toBeTruthy();
  });
});

describe("the owner dashboard drops what only a visitor needs", () => {
  it("does not pitch running a local cockpit", async () => {
    stubSnapshotFetch();
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("$128.00")).toBeTruthy();
    });
    expect(screen.queryByText("Drive your own machine")).toBeNull();
    expect(document.body.textContent ?? "").not.toContain("local-cockpit.py");
  });
});
