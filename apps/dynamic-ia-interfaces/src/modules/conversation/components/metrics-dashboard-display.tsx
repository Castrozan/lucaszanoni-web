import type { DisplayMetricsDashboardToolOutput } from "@/intent/tools/display-metrics-dashboard-tool";

export function MetricsDashboardDisplay({
  title,
  metrics,
  chartData,
}: DisplayMetricsDashboardToolOutput) {
  const maxChartValue = Math.max(...chartData.map((dataPoint) => dataPoint.value));

  return (
    <div className="w-full max-w-2xl overflow-hidden rounded-lg border border-border">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
        {metrics.map((metric) => (
          <MetricKpiCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            unit={metric.unit}
            trend={metric.trend}
            changePercentage={metric.changePercentage}
          />
        ))}
      </div>

      <div className="border-t border-border p-4">
        <div className="flex items-end gap-2" style={{ height: "120px" }}>
          {chartData.map((dataPoint) => (
            <BarChartColumn
              key={dataPoint.label}
              label={dataPoint.label}
              value={dataPoint.value}
              maxValue={maxChartValue}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricKpiCard({
  label,
  value,
  unit,
  trend,
  changePercentage,
}: DisplayMetricsDashboardToolOutput["metrics"][number]) {
  const trendColorClass =
    trend === "up"
      ? "text-green-400"
      : trend === "down"
        ? "text-red-400"
        : "text-muted-foreground";

  const trendArrow =
    trend === "up" ? "↑" : trend === "down" ? "↓" : "→";

  return (
    <div className="rounded-md border border-border/50 p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">
        {unit === "$" ? "$" : ""}
        {typeof value === "number" && value >= 1000
          ? value.toLocaleString()
          : value}
        {unit && unit !== "$" ? unit : ""}
      </p>
      <p className={`mt-1 text-xs ${trendColorClass}`}>
        {trendArrow} {Math.abs(changePercentage).toFixed(1)}%
      </p>
    </div>
  );
}

function BarChartColumn({
  label,
  value,
  maxValue,
}: {
  label: string;
  value: number;
  maxValue: number;
}) {
  const heightPercentage = (value / maxValue) * 100;

  return (
    <div className="flex flex-1 flex-col items-center gap-1">
      <div className="flex w-full flex-1 items-end">
        <div
          className="w-full rounded-t bg-blue-500/60 transition-all"
          style={{ height: `${heightPercentage}%` }}
        />
      </div>
      <span className="text-muted-foreground text-xs">{label}</span>
    </div>
  );
}
