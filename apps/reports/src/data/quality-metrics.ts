import { useEffect, useState } from "react";
import { qualityMetricsUrl } from "./report-artifact-sources";

export interface StaticEvalMetrics {
  readonly totalTests: number;
  readonly passedTests: number;
  readonly passRate: number;
  readonly suiteCount: number;
  readonly categoryCount: number;
  readonly recordedAt: string;
  readonly recordedCommit: string;
}

export interface CoreRulesMetrics {
  readonly lineCount: number;
  readonly ruleBlockCount: number;
}

export interface HookMetrics {
  readonly wiredEvents: readonly string[];
  readonly entryPointCount: number;
}

export interface QualityMetrics {
  readonly generatedAt: string;
  readonly generatedCommit: string;
  readonly staticEvals: StaticEvalMetrics;
  readonly integrationScenarioCount: number;
  readonly endToEndScenarioCount: number;
  readonly coreRules: CoreRulesMetrics;
  readonly hooks: HookMetrics;
}

export const qualityMetricsFallbackSnapshot: QualityMetrics = {
  generatedAt: "2026-07-22T20:13:44.506132+00:00",
  generatedCommit: "91e857fd",
  staticEvals: {
    totalTests: 166,
    passedTests: 158,
    passRate: 0.9518,
    suiteCount: 14,
    categoryCount: 5,
    recordedAt: "2026-07-21T04:44:50.972963+00:00",
    recordedCommit: "bcab73fb",
  },
  integrationScenarioCount: 7,
  endToEndScenarioCount: 35,
  coreRules: {
    lineCount: 76,
    ruleBlockCount: 18,
  },
  hooks: {
    wiredEvents: [
      "post-tool-use",
      "pre-tool-use",
      "session-start",
      "stop",
      "user-prompt-submit",
    ],
    entryPointCount: 18,
  },
};

export function isCompleteQualityMetricsPayload(
  payload: unknown,
): payload is QualityMetrics {
  if (typeof payload !== "object" || payload === null) {
    return false;
  }
  const candidate = payload as Partial<QualityMetrics>;
  return (
    typeof candidate.generatedAt === "string" &&
    typeof candidate.integrationScenarioCount === "number" &&
    typeof candidate.endToEndScenarioCount === "number" &&
    typeof candidate.staticEvals?.totalTests === "number" &&
    typeof candidate.staticEvals?.suiteCount === "number" &&
    typeof candidate.coreRules?.lineCount === "number" &&
    typeof candidate.coreRules?.ruleBlockCount === "number" &&
    typeof candidate.hooks?.entryPointCount === "number"
  );
}

export function formatMetricsGeneratedDate(generatedAt: string): string {
  const generatedDate = new Date(generatedAt);
  return Number.isNaN(generatedDate.valueOf())
    ? "an unknown date"
    : generatedDate.toISOString().slice(0, 10);
}

export function useQualityMetrics(): QualityMetrics {
  const [metrics, setMetrics] = useState<QualityMetrics>(
    qualityMetricsFallbackSnapshot,
  );
  useEffect(() => {
    let subscribed = true;
    fetch(qualityMetricsUrl)
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (subscribed && isCompleteQualityMetricsPayload(payload)) {
          setMetrics(payload);
        }
      })
      .catch(() => undefined);
    return () => {
      subscribed = false;
    };
  }, []);
  return metrics;
}
