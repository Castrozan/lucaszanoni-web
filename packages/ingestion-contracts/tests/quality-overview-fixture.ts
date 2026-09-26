import type {
  QualityOverviewEvidence,
  QualityOverviewPayload,
} from "../src/topics/quality-overview/quality-overview-types";

export function qualityOverviewFixture(): QualityOverviewPayload {
  const subject = {
    repository: "Castrozan/.dotfiles",
    revision: "a".repeat(40),
    artifactDigest: "b".repeat(64),
  };
  const scope = {
    name: "Owned fixture",
    tier: "unit",
    platform: "linux",
    exclusions: ["model turns"],
  };
  const run = {
    id: "1",
    url: "https://github.com/Castrozan/.dotfiles/actions/runs/1",
    startedAt: "2026-09-26T00:00:00Z",
    completedAt: "2026-09-26T00:01:00Z",
  };
  return {
    overview: {
      schemaVersion: 1,
      name: "Owned overview fixture",
      generatedAt: "2026-09-26T00:01:30Z",
      subject,
      limits: ["Independent measurements without a combined score"],
      evidence: [
        {
          id: "tests",
          label: "Native tests",
          category: "tests",
          target: null,
          scope,
          subject,
          run,
          source: {
            uri: "https://example.test/results.xml",
            sha256: "c".repeat(64),
          },
          detailsUri: "evidence/tests.json",
          validity: "valid",
          freshness: { status: "fresh", ageSeconds: 30, maxAgeSeconds: 3600 },
          outcome: "passed",
          usable: true,
          issues: [],
          measurement: {
            kind: "tests",
            counts: { passed: 2, failed: 0, error: 0, skipped: 1, total: 3 },
            durationSeconds: 0.2,
          },
        },
        {
          id: "adherence",
          label: "Instruction adherence",
          category: "instruction",
          target: "claude",
          scope,
          subject,
          run: null,
          source: null,
          detailsUri: null,
          validity: "unmeasured",
          freshness: {
            status: "unknown",
            ageSeconds: null,
            maxAgeSeconds: 3600,
          },
          outcome: "unmeasured",
          usable: false,
          issues: ["No model turn executed"],
          measurement: null,
        },
      ],
    },
    workflow: {
      repository: subject.repository,
      revision: subject.revision,
      runId: "1",
      runAttempt: 1,
      runUrl: run.url,
      conclusion: "failure",
      startedAt: run.startedAt,
      completedAt: "2026-09-26T00:01:20Z",
    },
    detailsBaseUrl:
      "https://storage.googleapis.com/zg-url-shortener-2026-dotfiles-usage-snapshots/reports/overview/1/1/",
  };
}

export function replaceOverviewEvidence(
  evidence: Partial<QualityOverviewEvidence>,
): QualityOverviewPayload {
  const payload = qualityOverviewFixture();
  return {
    ...payload,
    overview: {
      ...payload.overview,
      evidence: [
        { ...payload.overview.evidence[0]!, ...evidence },
        payload.overview.evidence[1]!,
      ],
    },
  };
}

export function artifactOverviewFixture(): QualityOverviewPayload {
  return replaceOverviewEvidence({
    id: "artifact",
    category: "artifact",
    target: "codex",
    detailsUri: "evidence/artifact.json",
    measurement: {
      kind: "artifact",
      gate: "pass",
      suiteDigest: "d".repeat(64),
      artifactBefore: "b".repeat(64),
      artifactAfter: "b".repeat(64),
      counts: { pass: 1, fail: 0, error: 0, "not-run": 0, expected: 1 },
      cases: [
        {
          id: "discovery",
          kind: "codex-discovery",
          target: "codex",
          status: "pass",
          reason: "Matched owned fixture",
          durationMs: 10,
        },
      ],
    },
  });
}
