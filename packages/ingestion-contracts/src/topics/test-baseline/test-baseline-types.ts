export const DOTFILES_TEST_BASELINE_TOPIC = "dotfiles-test-baseline";

export const DOTFILES_TEST_BASELINE_SCHEMA_VERSION = 1;

export interface TestBaselineTestResult {
  readonly name: string;
  readonly passed: boolean;
}

export interface TestBaselineCategoryResult {
  readonly category: string;
  readonly passed: number;
  readonly failed: number;
  readonly tests: readonly TestBaselineTestResult[];
}

export interface TestBaselinePayload {
  readonly recordedAt: string;
  readonly commit: string;
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly passRate: number;
  readonly categories: readonly TestBaselineCategoryResult[];
}
