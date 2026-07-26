import type {
  TestQualityGoldStandardPractice,
  TestQualityInstructionLoadingExperiment,
} from "@platform/ingestion-contracts";
import {
  useIngestedTestQualitySnapshot,
  type IngestedTestQualitySnapshot,
} from "./test-quality-snapshot";

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
  readonly goldStandardPractices: readonly TestQualityGoldStandardPractice[];
  readonly instructionLoadingExperiment: TestQualityInstructionLoadingExperiment;
}

export function formatMetricsGeneratedDate(generatedAt: string): string {
  const generatedDate = new Date(generatedAt);
  return Number.isNaN(generatedDate.valueOf())
    ? "an unknown date"
    : generatedDate.toISOString().slice(0, 10);
}

export function readQualityMetricsFromIngestedSnapshot(
  snapshot: IngestedTestQualitySnapshot,
): QualityMetrics {
  const { payload } = snapshot;
  return {
    generatedAt: payload.recordedAt,
    generatedCommit: payload.commit,
    staticEvals: payload.staticEvals,
    integrationScenarioCount: payload.integrationScenarioCount,
    endToEndScenarioCount: payload.endToEndScenarioCount,
    coreRules: payload.coreRules,
    hooks: payload.hooks,
    goldStandardPractices: payload.goldStandardPractices,
    instructionLoadingExperiment: payload.instructionLoadingExperiment,
  };
}

export function useQualityMetrics(): QualityMetrics | null {
  const snapshot = useIngestedTestQualitySnapshot();
  return snapshot ? readQualityMetricsFromIngestedSnapshot(snapshot) : null;
}
