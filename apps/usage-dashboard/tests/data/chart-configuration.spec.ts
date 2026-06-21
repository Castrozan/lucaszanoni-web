import { describe, expect, it } from "vitest";
import type { ChartSeries } from "@platform/snapshot-data";
import { buildDailyTokensChartConfiguration } from "../../src/data/chart-configuration";
import { sampleUsageViewModel } from "../test-fixtures/usage-view-model-fixture";

describe("buildDailyTokensChartConfiguration", () => {
  const configuration = buildDailyTokensChartConfiguration(
    sampleUsageViewModel.chart,
  );

  it("uses the snapshot dates as the x-axis labels", () => {
    expect(configuration.data.labels).toEqual(["2026-05-01", "2026-05-02"]);
  });

  it("maps every account series to its own dataset preserving null gaps", () => {
    expect(configuration.data.datasets).toHaveLength(2);
    expect(configuration.data.datasets[0]?.label).toBe("2c9c0c7cb164");
    expect(configuration.data.datasets[0]?.data).toEqual([120000, 240000]);
    expect(configuration.data.datasets[1]?.label).toBe("7f1ad9e3b220");
    expect(configuration.data.datasets[1]?.data).toEqual([80000, null]);
  });

  it("assigns palette colors by series index with a translucent fill", () => {
    expect(configuration.data.datasets[0]?.borderColor).toBe("#58a6ff");
    expect(configuration.data.datasets[0]?.backgroundColor).toBe("#58a6ff26");
    expect(configuration.data.datasets[1]?.borderColor).toBe("#3fb950");
    expect(configuration.data.datasets[1]?.backgroundColor).toBe("#3fb95026");
  });

  it("spans null gaps and keeps the github-dark axis styling", () => {
    expect(configuration.data.datasets[0]?.spanGaps).toBe(true);
    expect(configuration.options.plugins?.title?.text).toBe(
      "daily tokens per account",
    );
    expect(configuration.options.plugins?.legend?.labels?.color).toBe(
      "#e6edf3",
    );
  });

  it("applies injected theme axis colors across legend, title, ticks and grid", () => {
    const themed = buildDailyTokensChartConfiguration(
      sampleUsageViewModel.chart,
      {
        legendLabelColor: "#1f2328",
        axisLabelColor: "#656d76",
        gridLineColor: "#d0d7de",
      },
    );
    expect(themed.options.plugins?.legend?.labels?.color).toBe("#1f2328");
    expect(themed.options.plugins?.title?.color).toBe("#656d76");
    expect(themed.options.scales?.y?.ticks?.color).toBe("#656d76");
    expect(themed.options.scales?.x?.grid?.color).toBe("#d0d7de");
  });

  it("wraps palette colors back to the first when accounts outnumber the palette", () => {
    const sixSeriesChart: ChartSeries = {
      dates: ["2026-05-01"],
      series: Array.from({ length: 6 }, (_unused, seriesIndex) => ({
        account_label: `account-${seriesIndex}`,
        values: [seriesIndex],
      })),
    };
    const wrappedConfiguration =
      buildDailyTokensChartConfiguration(sixSeriesChart);
    expect(wrappedConfiguration.data.datasets[5]?.borderColor).toBe("#58a6ff");
  });
});
