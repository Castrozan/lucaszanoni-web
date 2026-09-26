export const DOTFILES_QUALITY_OVERVIEW_TOPIC = "dotfiles-quality-overview";
export const DOTFILES_QUALITY_OVERVIEW_SCHEMA_VERSION = 1;

export interface QualityOverviewSubject {
  readonly repository: string;
  readonly revision: string;
  readonly artifactDigest?: string;
}

export interface QualityOverviewScope {
  readonly name: string;
  readonly tier: string;
  readonly platform: string;
  readonly exclusions: readonly string[];
}

export interface QualityOverviewRun {
  readonly id: string;
  readonly url: string;
  readonly startedAt: string;
  readonly completedAt: string;
}

export interface QualityOverviewCoverageCount {
  readonly covered: number;
  readonly total: number;
}

export interface QualityOverviewArtifactCase {
  readonly id: string;
  readonly kind: string;
  readonly target: string | null;
  readonly status: "pass" | "fail" | "error" | "not-run";
  readonly reason: string;
  readonly durationMs: number;
}

export type QualityOverviewMeasurement =
  | {
      readonly kind: "tests";
      readonly counts: {
        readonly passed: number;
        readonly failed: number;
        readonly error: number;
        readonly skipped: number;
        readonly total: number;
      };
      readonly durationSeconds: number | null;
    }
  | {
      readonly kind: "coverage";
      readonly lineCoverage: QualityOverviewCoverageCount;
      readonly branchCoverage: QualityOverviewCoverageCount | null;
      readonly files: number;
    }
  | {
      readonly kind: "artifact";
      readonly gate: "pass" | "fail";
      readonly suiteDigest: string;
      readonly artifactBefore: string | null;
      readonly artifactAfter: string | null;
      readonly counts: {
        readonly pass: number;
        readonly fail: number;
        readonly error: number;
        readonly "not-run": number;
        readonly expected: number;
      };
      readonly cases: readonly QualityOverviewArtifactCase[];
    };

export interface QualityOverviewEvidence {
  readonly id: string;
  readonly label: string;
  readonly category:
    | "artifact"
    | "tests"
    | "coverage"
    | "mutation"
    | "instruction";
  readonly target: string | null;
  readonly scope: QualityOverviewScope;
  readonly subject: QualityOverviewSubject;
  readonly run: QualityOverviewRun | null;
  readonly source: {
    readonly uri: string;
    readonly sha256: string | null;
  } | null;
  readonly detailsUri: string | null;
  readonly validity:
    | "valid"
    | "missing"
    | "malformed"
    | "empty"
    | "pre-existing"
    | "unsupported"
    | "unmeasured"
    | "incompatible";
  readonly freshness: {
    readonly status: "fresh" | "stale" | "unknown";
    readonly ageSeconds: number | null;
    readonly maxAgeSeconds: number;
  };
  readonly outcome:
    | "passed"
    | "failed"
    | "error"
    | "skipped"
    | "not-run"
    | "measured"
    | "unmeasured";
  readonly usable: boolean;
  readonly issues: readonly string[];
  readonly measurement: QualityOverviewMeasurement | null;
}

export interface QualityOverview {
  readonly schemaVersion: 1;
  readonly name: string;
  readonly generatedAt: string;
  readonly subject: QualityOverviewSubject;
  readonly evidence: readonly QualityOverviewEvidence[];
  readonly limits: readonly string[];
}

export interface QualityOverviewWorkflow {
  readonly repository: string;
  readonly revision: string;
  readonly runId: string;
  readonly runAttempt: number;
  readonly runUrl: string;
  readonly conclusion:
    | "success"
    | "failure"
    | "cancelled"
    | "timed_out"
    | "action_required"
    | "neutral"
    | "skipped"
    | "stale"
    | "startup_failure";
  readonly startedAt: string;
  readonly completedAt: string;
}

export interface QualityOverviewPayload {
  readonly overview: QualityOverview;
  readonly workflow: QualityOverviewWorkflow;
  readonly detailsBaseUrl: string;
}
