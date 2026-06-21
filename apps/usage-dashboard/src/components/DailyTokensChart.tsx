import { Chart, registerables } from "chart.js";
import { Line } from "react-chartjs-2";
import { THEME_PALETTES, useTheme } from "@platform/design-system";
import type { ChartSeries } from "@platform/snapshot-data";
import { buildDailyTokensChartConfiguration } from "../data/chart-configuration";

Chart.register(...registerables);

export interface DailyTokensChartProps {
  chart: ChartSeries;
}

export function DailyTokensChart({ chart }: DailyTokensChartProps) {
  const { themeName } = useTheme();
  const palette = THEME_PALETTES[themeName];
  const chartConfiguration = buildDailyTokensChartConfiguration(chart, {
    legendLabelColor: palette.textPrimary,
    axisLabelColor: palette.textMuted,
    gridLineColor: palette.border,
  });
  return (
    <div className="my-6 rounded-lg border border-border bg-surface p-4">
      <Line
        data={chartConfiguration.data}
        options={chartConfiguration.options}
      />
    </div>
  );
}
