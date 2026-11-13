import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { UsageDashboardPage } from "../../src/components/UsageDashboardPage";
import type { UsageViewModel } from "@platform/snapshot-data";
import { sampleUsageViewModel } from "../test-fixtures/usage-view-model-fixture";

vi.mock("@platform/usage-insights", () => ({
  DailyTokensChart: () => <div data-testid="daily-tokens-chart" />,
}));

afterEach(cleanup);

const emptyUsageViewModel: UsageViewModel = {
  ...sampleUsageViewModel,
  accounts: [],
  summary: { ...sampleUsageViewModel.summary, account_count: 0 },
};

const connectedStatusText = "connected · fetched 11:30:00 PM";
const noSnapshotsStatusText = "no usage snapshots received";
const errorStatusText = "live feed unavailable";
const loadingStatusText = "loading live snapshots";

function expectedStatusText(
  viewModel: UsageViewModel | null,
  errorMessage: string | null,
  isLoading: boolean,
): string {
  if (errorMessage) return errorStatusText;
  if (isLoading) return loadingStatusText;
  if (viewModel?.summary.account_count) return connectedStatusText;
  return noSnapshotsStatusText;
}

function normalizedBodyText(): string {
  return (document.body.textContent ?? "").replace(/\s+/g, " ");
}

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
    expect(screen.getByText(connectedStatusText)).toBeTruthy();
    expect(screen.getByText("accounts tracked")).toBeTruthy();
    expect(screen.getByTestId("daily-tokens-chart")).toBeTruthy();
    const baselineLink = screen.getByRole("link", {
      name: "agent instructions report",
    });
    expect(baselineLink.getAttribute("href")).toBe(
      "/engineering/dotfiles/reports/baseline/",
    );
  });

  it("reports an empty successful feed without a positive pulse", () => {
    render(
      <UsageDashboardPage
        viewModel={emptyUsageViewModel}
        errorMessage={null}
        isLoading={false}
        lastUpdatedLabel="11:30:00 PM"
      />,
    );
    expect(screen.getByText(noSnapshotsStatusText)).toBeTruthy();
    expect(screen.queryByText(/connected/)).toBeNull();
    expect(document.querySelector(".animate-live-pulse")).toBeNull();
  });

  it("resolves every status from error, loading and account presence", () => {
    const viewModelCases: (UsageViewModel | null)[] = [
      null,
      emptyUsageViewModel,
      sampleUsageViewModel,
    ];
    const errorMessageCases: (string | null)[] = [null, "network down"];
    const isLoadingCases = [false, true];
    const allStatusTexts = [
      connectedStatusText,
      noSnapshotsStatusText,
      errorStatusText,
      loadingStatusText,
    ];
    for (const viewModel of viewModelCases) {
      for (const errorMessage of errorMessageCases) {
        for (const isLoading of isLoadingCases) {
          const expected = expectedStatusText(
            viewModel,
            errorMessage,
            isLoading,
          );
          const { unmount } = render(
            <UsageDashboardPage
              viewModel={viewModel}
              errorMessage={errorMessage}
              isLoading={isLoading}
              lastUpdatedLabel="11:30:00 PM"
            />,
          );
          const bodyText = normalizedBodyText();
          expect(
            allStatusTexts.filter((statusText) =>
              bodyText.includes(statusText),
            ),
          ).toEqual([expected]);
          expect(document.querySelector(".animate-live-pulse") !== null).toBe(
            expected === connectedStatusText,
          );
          unmount();
        }
      }
    }
  });

  it("describes the private ingestion source without public storage claims", () => {
    render(
      <UsageDashboardPage
        viewModel={sampleUsageViewModel}
        errorMessage={null}
        isLoading={false}
        lastUpdatedLabel="11:30:00 PM"
      />,
    );
    const bodyText = normalizedBodyText();
    for (const requiredCopy of [
      "Private Claude Code usage metadata, collected offline with ccusage and published through authenticated ingestion.",
      "Account labels are opaque hashes; prompts and conversations are not published.",
      "Historical activity keeps its original source date.",
      "Reported costs are not verified billing totals.",
      "Optional OpenTelemetry counters provide a separate token-type breakdown when available.",
      "Collection times can differ; these counters do not measure billing or memory-recall savings.",
      "Cache-read tokens measure reused context, not fresh input.",
      "Compare them with input, output, and cache-creation tokens; token volume alone does not establish cost.",
      "This feed does not measure memory-recall savings.",
      "Token totals alone cannot attribute a reduction to deduplication, budgets, or debounce.",
      "Local usage records may span account changes.",
      "Each machine labels its export with the current account.",
      "Older usage may belong to a previous account; do not read the entire history as one account.",
      "Served by private Cloudflare Workers from D1-backed per-machine snapshots.",
      "Authenticated producers publish metadata through the ingestion API.",
    ]) {
      expect(bodyText).toContain(requiredCopy);
    }
    for (const forbiddenCopy of [
      "Cloud Storage",
      "Cloud Run",
      "stats-cache.json",
      "public",
      "export_usage_snapshot",
      "live · updated",
    ]) {
      expect(bodyText).not.toContain(forbiddenCopy);
    }
  });
});
