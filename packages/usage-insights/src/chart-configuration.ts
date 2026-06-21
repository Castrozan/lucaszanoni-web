import type { ChartData, ChartOptions } from "chart.js";
import {
  ACCOUNT_SERIES_COLORS,
  type ChartSeries,
} from "@platform/snapshot-data";

export interface DailyTokensChartConfiguration {
  data: ChartData<"line", (number | null)[], string>;
  options: ChartOptions<"line">;
}

export interface DailyTokensChartAxisColors {
  readonly legendLabelColor: string;
  readonly axisLabelColor: string;
  readonly gridLineColor: string;
}

export const DEFAULT_DAILY_TOKENS_CHART_AXIS_COLORS: DailyTokensChartAxisColors =
  {
    legendLabelColor: "#e6edf3",
    axisLabelColor: "#8b949e",
    gridLineColor: "#21262d",
  };

export function buildDailyTokensChartConfiguration(
  chartSeries: ChartSeries,
  axisColors: DailyTokensChartAxisColors = DEFAULT_DAILY_TOKENS_CHART_AXIS_COLORS,
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
        legend: { labels: { color: axisColors.legendLabelColor } },
        title: {
          display: true,
          text: "daily tokens per account",
          color: axisColors.axisLabelColor,
        },
      },
      scales: {
        y: {
          ticks: { color: axisColors.axisLabelColor },
          grid: { color: axisColors.gridLineColor },
        },
        x: {
          ticks: { color: axisColors.axisLabelColor },
          grid: { color: axisColors.gridLineColor },
        },
      },
    },
  };
}
