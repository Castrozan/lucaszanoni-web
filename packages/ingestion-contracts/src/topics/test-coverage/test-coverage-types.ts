export const DOTFILES_TEST_COVERAGE_TOPIC = "dotfiles-test-coverage";

export const DOTFILES_TEST_COVERAGE_SCHEMA_VERSION = 1;

export interface TestCoverageFileResult {
  readonly path: string;
  readonly coveredLines: number;
  readonly measurableLines: number;
  readonly lineCoverageRate: number;
}

export interface TestCoveragePayload {
  readonly recordedAt: string;
  readonly commit: string;
  readonly coveredLines: number;
  readonly measurableLines: number;
  readonly lineCoverageRate: number;
  readonly files: readonly TestCoverageFileResult[];
}
