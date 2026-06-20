import { Chart, registerables } from "chart.js";
import { Line } from "react-chartjs-2";
import type { ChartSeries } from "@lucaszanoni-web/snapshot-data";
import { buildDailyTokensChartConfiguration } from "../data/chart-configuration";

Chart.register(...registerables);

export interface DailyTokensChartProps {
  chart: ChartSeries;
}

export function DailyTokensChart({ chart }: DailyTokensChartProps) {
  const chartConfiguration = buildDailyTokensChartConfiguration(chart);
  return (
    <div className="chart-wrap">
      <Line
        data={chartConfiguration.data}
        options={chartConfiguration.options}
      />
    </div>
  );
}
