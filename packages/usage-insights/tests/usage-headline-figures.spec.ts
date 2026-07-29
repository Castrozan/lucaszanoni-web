import { describe, expect, it } from "vitest";
import type { UsageViewModel } from "@platform/snapshot-data";
import { buildUsageHeadlineFigures } from "../src/usage-headline-figures";

function usageViewModelWith(
  overrides: Partial<UsageViewModel> = {},
): UsageViewModel {
  return {
    accounts: [],
    summary: {
      account_count: 2,
      machine_count: 3,
      token_totals: {
        input_tokens: 1_200_000,
        output_tokens: 340_000,
        cache_read_input_tokens: 24_600_000,
        cache_creation_input_tokens: 900_000,
        cost_usd: 412.5,
      },
      memory_recall_savings: {
        memory_recall_session_count: 0,
        injected_recall_event_count: 0,
        injected_recall_character_total: 0,
        suppressed_recall_event_total: 0,
        dedup_suppressed_character_total: 0,
        suppressed_recall_event_count_by_reason: {},
      },
      otel_metrics: {
        token_usage_by_type: {},
        total_cost_usd: 0,
        has_data: false,
      },
      first_session_date: "2026-01-04",
      last_computed_date: "2026-07-28",
    },
    chart: {
      dates: ["2026-07-26", "2026-07-27", "2026-07-28"],
      series: [
        { account_label: "personal", values: [10_000, 20_000, 5_000] },
        { account_label: "work", values: [1_000, null, 7_500] },
      ],
    },
    ...overrides,
  };
}

describe("the dashboard leads with the figures the owner opens it for", () => {
  it("sums every token kind into one lifetime total", () => {
    const figures = buildUsageHeadlineFigures(usageViewModelWith());

    const total = figures.find((figure) => figure.id === "total-tokens");
    expect(total?.label).toBe("Total tokens");
    expect(total?.formattedValue).toBe("27.04M");
  });

  it("takes today's tokens from the latest charted day across accounts", () => {
    const figures = buildUsageHeadlineFigures(usageViewModelWith());

    const today = figures.find((figure) => figure.id === "tokens-today");
    expect(today?.formattedValue).toBe("12.5K");
    expect(today?.caption).toBe("2026-07-28");
  });

  it("reports spend in dollars and the fleet it covers", () => {
    const figures = buildUsageHeadlineFigures(usageViewModelWith());

    expect(
      figures.find((figure) => figure.id === "spend")?.formattedValue,
    ).toBe("$412.50");
    const fleet = figures.find((figure) => figure.id === "fleet");
    expect(fleet?.formattedValue).toBe("3");
    expect(fleet?.caption).toBe("2 accounts");
  });

  it("survives a view model with no charted days", () => {
    const figures = buildUsageHeadlineFigures(
      usageViewModelWith({ chart: { dates: [], series: [] } }),
    );

    const today = figures.find((figure) => figure.id === "tokens-today");
    expect(today?.formattedValue).toBe("0");
    expect(today?.caption).toBe("no sessions yet");
  });

  it("keeps a single machine singular", () => {
    const model = usageViewModelWith();
    const figures = buildUsageHeadlineFigures({
      ...model,
      summary: { ...model.summary, machine_count: 1, account_count: 1 },
    });

    expect(figures.find((figure) => figure.id === "fleet")?.caption).toBe(
      "1 account",
    );
  });
});
