import { IngestionContractViolationError } from "../../ingestion-types";
import type {
  QualityOverviewEvidence,
  QualityOverviewPayload,
} from "./quality-overview-types";

function requireConsistent(condition: boolean, message: string): void {
  if (!condition)
    throw new IngestionContractViolationError(`quality overview ${message}`);
}

function checkMeasurement(evidence: QualityOverviewEvidence): void {
  const measurement = evidence.measurement;
  if (measurement === null) {
    requireConsistent(
      !evidence.usable && evidence.outcome !== "passed",
      `${evidence.id} has no measurement`,
    );
    return;
  }
  if (measurement.kind === "tests") {
    const { passed, failed, error, skipped, total } = measurement.counts;
    requireConsistent(
      passed + failed + error + skipped === total,
      `${evidence.id} test counts contradict total`,
    );
    requireConsistent(
      evidence.outcome !== "passed" ||
        (passed > 0 && failed === 0 && error === 0),
      `${evidence.id} passing outcome contradicts tests`,
    );
    return;
  }
  if (measurement.kind === "coverage") {
    for (const count of [
      measurement.lineCoverage,
      measurement.branchCoverage,
    ]) {
      requireConsistent(
        count === null || count.covered <= count.total,
        `${evidence.id} coverage exceeds its scope`,
      );
    }
    requireConsistent(
      evidence.outcome !== "passed",
      `${evidence.id} coverage is a measurement, not a pass`,
    );
    return;
  }
  const counts = {
    pass: 0,
    fail: 0,
    error: 0,
    "not-run": 0,
    expected: measurement.cases.length,
  };
  requireConsistent(
    new Set(measurement.cases.map((item) => item.id)).size === counts.expected,
    `${evidence.id} contains duplicate cases`,
  );
  for (const item of measurement.cases) counts[item.status]++;
  for (const key of ["pass", "fail", "error", "not-run", "expected"] as const) {
    requireConsistent(
      counts[key] === measurement.counts[key],
      `${evidence.id} artifact counts contradict cases`,
    );
  }
  const allPassed = counts.expected > 0 && counts.pass === counts.expected;
  requireConsistent(
    evidence.validity !== "valid" ||
      (measurement.artifactBefore === evidence.subject.artifactDigest &&
        measurement.artifactAfter === measurement.artifactBefore),
    `${evidence.id} artifact identity contradicts valid evidence`,
  );
  requireConsistent(
    measurement.gate !== "pass" || allPassed,
    `${evidence.id} artifact gate contradicts cases`,
  );
  requireConsistent(
    evidence.outcome !== "passed" || measurement.gate === "pass",
    `${evidence.id} passing outcome contradicts artifact gate`,
  );
}

export function checkQualityOverviewConsistency(
  payload: QualityOverviewPayload,
): void {
  const { overview, workflow, detailsBaseUrl } = payload;
  requireConsistent(
    overview.subject.repository === workflow.repository &&
      overview.subject.revision === workflow.revision,
    "workflow and subject identities differ",
  );
  requireConsistent(
    workflow.runUrl ===
      `https://github.com/${workflow.repository}/actions/runs/${workflow.runId}`,
    "workflow URL does not identify the run",
  );
  requireConsistent(
    detailsBaseUrl.endsWith(`/${workflow.runId}/${workflow.runAttempt}/`),
    "detail origin does not identify the producing attempt",
  );
  requireConsistent(
    Date.parse(workflow.startedAt) <= Date.parse(workflow.completedAt),
    "workflow timestamps are reversed",
  );
  requireConsistent(
    new Set(overview.evidence.map((item) => item.id)).size ===
      overview.evidence.length,
    "contains duplicate evidence identifiers",
  );
  for (const evidence of overview.evidence) {
    requireConsistent(
      evidence.detailsUri === null ||
        (evidence.detailsUri === `evidence/${evidence.id}.json` &&
          /^evidence\/[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}\.json$/.test(
            evidence.detailsUri,
          )),
      `${evidence.id} detail path escapes its evidence origin`,
    );
    requireConsistent(
      evidence.validity !== "valid" ||
        (evidence.subject.repository === overview.subject.repository &&
          evidence.subject.revision === overview.subject.revision),
      `${evidence.id} subject contradicts valid evidence`,
    );
    requireConsistent(
      !evidence.usable || evidence.run !== null,
      `${evidence.id} usable evidence has no run`,
    );
    requireConsistent(
      !evidence.usable ||
        (evidence.validity === "valid" &&
          evidence.freshness.status === "fresh"),
      `${evidence.id} usability contradicts validity or freshness`,
    );
    if (evidence.run !== null)
      requireConsistent(
        Date.parse(evidence.run.startedAt) <=
          Date.parse(evidence.run.completedAt),
        `${evidence.id} timestamps are reversed`,
      );
    checkMeasurement(evidence);
  }
}
