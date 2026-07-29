import type { UsageViewModel } from "@platform/snapshot-data";

export interface UsageHeadlineFigure {
  readonly id: string;
  readonly label: string;
  readonly formattedValue: string;
  readonly caption: string;
}

const NO_SESSIONS_CAPTION = "no sessions yet";

export function buildUsageHeadlineFigures(
  viewModel: UsageViewModel,
): readonly UsageHeadlineFigure[] {
  const { summary, chart } = viewModel;
  const latestChartedDayIndex = chart.dates.length - 1;
  const tokensOnLatestChartedDay =
    latestChartedDayIndex < 0
      ? 0
      : chart.series.reduce(
          (runningTotal, accountSeries) =>
            runningTotal + (accountSeries.values[latestChartedDayIndex] ?? 0),
          0,
        );
  return [
    {
      id: "latest-day",
      label: "Latest day",
      formattedValue: formatTokenCount(tokensOnLatestChartedDay),
      caption: chart.dates[latestChartedDayIndex] ?? NO_SESSIONS_CAPTION,
    },
    {
      id: "total-tokens",
      label: "Total tokens",
      formattedValue: formatTokenCount(sumEveryTokenKind(summary.token_totals)),
      caption: summary.first_session_date
        ? `since ${summary.first_session_date}`
        : NO_SESSIONS_CAPTION,
    },
    billedFigureOrCacheReadShare(summary.token_totals),
    {
      id: "fleet",
      label: "Machines",
      formattedValue: String(summary.machine_count),
      caption: pluralize(summary.account_count, "account"),
    },
  ];
}

function billedFigureOrCacheReadShare(
  tokenTotals: UsageViewModel["summary"]["token_totals"],
): UsageHeadlineFigure {
  if (tokenTotals.cost_usd > 0) {
    return {
      id: "spend",
      label: "Spend",
      formattedValue: formatUnitedStatesDollars(tokenTotals.cost_usd),
      caption: "billed to date",
    };
  }
  const everyToken = sumEveryTokenKind(tokenTotals);
  return {
    id: "cache-reads",
    label: "Cache reads",
    formattedValue:
      everyToken === 0
        ? "0%"
        : `${Math.round((tokenTotals.cache_read_input_tokens / everyToken) * 100)}%`,
    caption: "of all tokens",
  };
}

function sumEveryTokenKind(
  tokenTotals: UsageViewModel["summary"]["token_totals"],
): number {
  return (
    tokenTotals.input_tokens +
    tokenTotals.output_tokens +
    tokenTotals.cache_read_input_tokens +
    tokenTotals.cache_creation_input_tokens
  );
}

function formatTokenCount(tokenCount: number): string {
  if (tokenCount >= 1_000_000_000) {
    return `${trimTrailingZeros(tokenCount / 1_000_000_000)}B`;
  }
  if (tokenCount >= 1_000_000) {
    return `${trimTrailingZeros(tokenCount / 1_000_000)}M`;
  }
  if (tokenCount >= 1_000) {
    return `${trimTrailingZeros(tokenCount / 1_000)}K`;
  }
  return String(Math.round(tokenCount));
}

function trimTrailingZeros(scaledValue: number): string {
  return scaledValue.toFixed(2).replace(/\.?0+$/, "");
}

function formatUnitedStatesDollars(amountInDollars: number): string {
  return `$${amountInDollars.toFixed(2)}`;
}

function pluralize(count: number, singularNoun: string): string {
  return `${count} ${singularNoun}${count === 1 ? "" : "s"}`;
}
