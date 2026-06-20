import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { UsageDashboardPage } from "./UsageDashboardPage";
import { sampleUsageViewModel } from "../test-fixtures/usage-view-model-fixture";

vi.mock("./DailyTokensChart", () => ({
  DailyTokensChart: () => <div data-testid="daily-tokens-chart" />,
}));

afterEach(cleanup);

describe("UsageDashboardPage", () => {
  it("renders the loading status while the first snapshot is in flight", () => {
    render(
      <UsageDashboardPage
        viewModel={null}
        errorMessage={null}
        isLoading={true}
        lastUpdatedLabel={null}
      />,
    );
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "token usage across accounts",
      }),
    ).toBeTruthy();
    expect(screen.getByText("loading live snapshots")).toBeTruthy();
    expect(document.querySelector("[data-slot='card']")).toBeNull();
  });

  it("surfaces the feed error and omits the dashboard body", () => {
    render(
      <UsageDashboardPage
        viewModel={null}
        errorMessage="network down"
        isLoading={false}
        lastUpdatedLabel={null}
      />,
    );
    expect(screen.getByText("live feed unavailable")).toBeTruthy();
    expect(
      screen.getByText(/Could not reach the snapshot feed: network down/),
    ).toBeTruthy();
    expect(screen.queryByTestId("daily-tokens-chart")).toBeNull();
  });

  it("renders the full dashboard body and live timestamp when loaded", () => {
    render(
      <UsageDashboardPage
        viewModel={sampleUsageViewModel}
        errorMessage={null}
        isLoading={false}
        lastUpdatedLabel="11:30:00 PM"
      />,
    );
    expect(screen.getByText(/live · updated 11:30:00 PM/)).toBeTruthy();
    expect(screen.getByText("accounts tracked")).toBeTruthy();
    expect(screen.getByTestId("daily-tokens-chart")).toBeTruthy();
    const baselineLink = screen.getByRole("link", {
      name: "agent-eval baseline",
    });
    expect(baselineLink.getAttribute("href")).toBe("/reports/baseline/");
  });
});
