import { describe, expect, it } from "vitest";
import {
  formatMetricsGeneratedDate,
  isCompleteQualityMetricsPayload,
  qualityMetricsFallbackSnapshot,
} from "../../src/data/quality-metrics";
import { qualityMetricsUrl } from "../../src/data/report-artifact-sources";

describe("qualityMetricsUrl", () => {
  it("points at the quality prefix the dotfiles deploy publishes", () => {
    expect(qualityMetricsUrl).toBe(
      "https://storage.googleapis.com/zg-url-shortener-2026-dotfiles-usage-snapshots/reports/quality/metrics.json",
    );
  });
});

describe("isCompleteQualityMetricsPayload", () => {
  it("accepts the shape the generator publishes", () => {
    expect(
      isCompleteQualityMetricsPayload(qualityMetricsFallbackSnapshot),
    ).toBe(true);
  });

  it("rejects a payload missing the nested counts the page renders", () => {
    expect(
      isCompleteQualityMetricsPayload({
        generatedAt: "2026-07-22T20:13:44.506132+00:00",
        integrationScenarioCount: 7,
        endToEndScenarioCount: 35,
        staticEvals: { totalTests: 166 },
      }),
    ).toBe(false);
  });

  it("rejects values that are not objects", () => {
    expect(isCompleteQualityMetricsPayload(null)).toBe(false);
    expect(isCompleteQualityMetricsPayload("not json")).toBe(false);
    expect(isCompleteQualityMetricsPayload(undefined)).toBe(false);
  });
});

describe("formatMetricsGeneratedDate", () => {
  it("renders an ISO timestamp as a plain calendar date", () => {
    expect(formatMetricsGeneratedDate("2026-07-22T20:13:44.506132+00:00")).toBe(
      "2026-07-22",
    );
  });

  it("degrades to a readable phrase when the timestamp is unparseable", () => {
    expect(formatMetricsGeneratedDate("whenever")).toBe("an unknown date");
  });
});

describe("qualityMetricsFallbackSnapshot", () => {
  it("keeps every count positive so the page never renders a zero", () => {
    expect(
      qualityMetricsFallbackSnapshot.staticEvals.totalTests,
    ).toBeGreaterThan(0);
    expect(
      qualityMetricsFallbackSnapshot.endToEndScenarioCount,
    ).toBeGreaterThan(0);
    expect(
      qualityMetricsFallbackSnapshot.integrationScenarioCount,
    ).toBeGreaterThan(0);
    expect(qualityMetricsFallbackSnapshot.coreRules.lineCount).toBeGreaterThan(
      0,
    );
    expect(
      qualityMetricsFallbackSnapshot.hooks.entryPointCount,
    ).toBeGreaterThan(0);
  });
});
