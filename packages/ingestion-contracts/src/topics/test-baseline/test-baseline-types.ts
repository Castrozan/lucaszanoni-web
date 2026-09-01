export const DOTFILES_TEST_BASELINE_TOPIC = "dotfiles-test-baseline";

export const DOTFILES_TEST_BASELINE_SCHEMA_VERSION = 1;

export interface TestBaselineExecutionRole {
  readonly harness: string;
  readonly model: string | null;
  readonly reasoningEffort: string | null;
}

export interface TestBaselineExecutionProfile {
  readonly subject: TestBaselineExecutionRole;
  readonly judge: TestBaselineExecutionRole;
}

export interface TestBaselineNamedExecutionProfile extends TestBaselineExecutionProfile {
  readonly id: string;
}

export interface TestBaselineRunSource {
  readonly kind: string;
  readonly gitCommit?: string;
  readonly sessionId?: string | number;
}

export interface TestBaselineProviderUsage {
  readonly invocations: number;
  readonly measuredInvocations: number;
  readonly inputTokens: number;
  readonly cachedInputTokens: number;
  readonly cacheWriteInputTokens: number;
  readonly outputTokens: number;
  readonly reasoningOutputTokens: number;
}

export type TestBaselineTokenUsage = Readonly<
  Record<string, Readonly<Record<string, TestBaselineProviderUsage>>>
>;

export interface TestBaselineTestResult {
  readonly name: string;
  readonly passed: boolean;
  readonly fingerprint?: string;
  readonly generatedAt?: string;
  readonly executionProfileId?: string;
  readonly runSource?: TestBaselineRunSource;
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
  readonly oldestEvidenceAt?: string;
  readonly minimumCurrentEvidence?: number;
  readonly executionProfile?: TestBaselineExecutionProfile;
  readonly executionProfiles?: readonly TestBaselineNamedExecutionProfile[];
  readonly tokenUsage?: TestBaselineTokenUsage;
  readonly categories: readonly TestBaselineCategoryResult[];
}
