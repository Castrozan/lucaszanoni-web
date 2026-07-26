export const DOTFILES_TEST_QUALITY_TOPIC = "dotfiles-test-quality";

export const DOTFILES_TEST_QUALITY_SCHEMA_VERSION = 1;

export interface TestQualityStaticEvalSummary {
  readonly totalTests: number;
  readonly passedTests: number;
  readonly passRate: number;
  readonly suiteCount: number;
  readonly categoryCount: number;
  readonly recordedAt: string;
  readonly recordedCommit: string;
}

export interface TestQualityCoreRuleSummary {
  readonly lineCount: number;
  readonly ruleBlockCount: number;
}

export interface TestQualityHookSummary {
  readonly wiredEvents: readonly string[];
  readonly entryPointCount: number;
}

export interface TestQualityGoldStandardPractice {
  readonly practice: string;
  readonly adopted: boolean;
  readonly measurement: number;
  readonly measurementUnit: string;
  readonly evidence: string;
}

export interface TestQualityPayload {
  readonly recordedAt: string;
  readonly commit: string;
  readonly staticEvals: TestQualityStaticEvalSummary;
  readonly integrationScenarioCount: number;
  readonly endToEndScenarioCount: number;
  readonly coreRules: TestQualityCoreRuleSummary;
  readonly hooks: TestQualityHookSummary;
  readonly goldStandardPractices: readonly TestQualityGoldStandardPractice[];
}
