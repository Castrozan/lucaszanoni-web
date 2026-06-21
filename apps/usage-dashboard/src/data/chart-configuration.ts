import type { ChartData, ChartOptions } from "chart.js";
import {
  ACCOUNT_SERIES_COLORS,
  type ChartSeries,
} from "@platform/snapshot-data";

export interface DailyTokensChartConfiguration {
  data: ChartData<"line", (number | null)[], string>;
  options: ChartOptions<"line">;
}

export function buildDailyTokensChartConfiguration(
  chartSeries: ChartSeries,
): DailyTokensChartConfiguration {
  return {
    data: {
      labels: chartSeries.dates,
      datasets: chartSeries.series.map((accountSeries, seriesIndex) => {
        const color =
          ACCOUNT_SERIES_COLORS[seriesIndex % ACCOUNT_SERIES_COLORS.length]!;
        return {
          label: accountSeries.account_label,
          data: accountSeries.values,
          borderColor: color,
          backgroundColor: `${color}26`,
          tension: 0.2,
          spanGaps: true,
          pointRadius: 2,
        };
      }),
    },
    options: {
      plugins: {
        legend: { labels: { color: "#e6edf3" } },
        title: {
          display: true,
          text: "daily tokens per account",
          color: "#8b949e",
        },
      },
      scales: {
        y: { ticks: { color: "#8b949e" }, grid: { color: "#21262d" } },
        x: { ticks: { color: "#8b949e" }, grid: { color: "#21262d" } },
      },
    },
  };
}
