import { tool } from "ai";
import { z } from "zod";

export const displayMetricsDashboardToolOutputSchema = z.object({
  title: z.string(),
  metrics: z.array(
    z.object({
      label: z.string(),
      value: z.number(),
      unit: z.string(),
      trend: z.enum(["up", "down", "stable"]),
      changePercentage: z.number(),
    }),
  ),
  chartData: z.array(
    z.object({
      label: z.string(),
      value: z.number(),
    }),
  ),
});

export type DisplayMetricsDashboardToolOutput = z.infer<
  typeof displayMetricsDashboardToolOutputSchema
>;

export const displayMetricsDashboardTool = tool({
  description:
    "Display a metrics dashboard with KPIs and chart data. Use when the user asks about statistics, metrics, performance, analytics, KPIs, or status overview.",
  inputSchema: z.object({
    topic: z.string().describe("What metrics to display (e.g., 'website analytics', 'sales performance')"),
  }),
  execute: async function ({ topic }) {
    return {
      title: `${topic} Dashboard`,
      metrics: generateMetricsForTopic(topic),
      chartData: generateChartDataForTopic(topic),
    };
  },
});

function generateMetricsForTopic(
  topic: string,
): DisplayMetricsDashboardToolOutput["metrics"] {
  const topicLower = topic.toLowerCase();

  if (topicLower.includes("web") || topicLower.includes("traffic") || topicLower.includes("analytics")) {
    return [
      { label: "Page Views", value: 142580, unit: "", trend: "up", changePercentage: 12.5 },
      { label: "Unique Visitors", value: 48920, unit: "", trend: "up", changePercentage: 8.3 },
      { label: "Bounce Rate", value: 34.2, unit: "%", trend: "down", changePercentage: -5.1 },
      { label: "Avg Session", value: 4.2, unit: "min", trend: "up", changePercentage: 3.7 },
    ];
  }

  if (topicLower.includes("sales") || topicLower.includes("revenue")) {
    return [
      { label: "Revenue", value: 284500, unit: "$", trend: "up", changePercentage: 15.2 },
      { label: "Orders", value: 1247, unit: "", trend: "up", changePercentage: 9.8 },
      { label: "Avg Order Value", value: 228, unit: "$", trend: "up", changePercentage: 4.9 },
      { label: "Conversion Rate", value: 3.8, unit: "%", trend: "stable", changePercentage: 0.2 },
    ];
  }

  return [
    { label: "Total", value: 12450, unit: "", trend: "up", changePercentage: 7.5 },
    { label: "Active", value: 8920, unit: "", trend: "up", changePercentage: 12.1 },
    { label: "Growth Rate", value: 18.4, unit: "%", trend: "up", changePercentage: 3.2 },
    { label: "Efficiency", value: 94.2, unit: "%", trend: "stable", changePercentage: 0.5 },
  ];
}

function generateChartDataForTopic(
  topic: string,
): DisplayMetricsDashboardToolOutput["chartData"] {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const baseValue = topic.toLowerCase().includes("sales") ? 40000 : 20000;

  return months.map((month, index) => ({
    label: month,
    value: Math.round(baseValue + index * 5000 + Math.sin(index) * 3000),
  }));
}
