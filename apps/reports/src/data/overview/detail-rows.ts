import type { QualityOverviewEvidence } from "@platform/ingestion-contracts";
import { coverageLabel } from "./evidence-status";

export interface DetailRow {
  readonly name: string;
  readonly status: string;
  readonly description: string;
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid detail record");
  return value as Record<string, unknown>;
}

function text(value: unknown): string {
  if (typeof value !== "string") throw new Error("Invalid detail text");
  return value;
}

function array(value: unknown): unknown[] {
  if (!Array.isArray(value) || value.length > 100000)
    throw new Error("Invalid detail inventory");
  return value;
}

function count(value: unknown) {
  const record = object(value);
  const covered = record.covered;
  const total = record.total;
  if (
    typeof covered !== "number" ||
    typeof total !== "number" ||
    !Number.isSafeInteger(covered) ||
    !Number.isSafeInteger(total) ||
    covered < 0 ||
    covered > total
  )
    throw new Error("Invalid coverage count");
  return { covered, total };
}

function testRows(
  value: Record<string, unknown>,
  evidence: QualityOverviewEvidence,
): DetailRow[] {
  if (evidence.measurement?.kind !== "tests")
    throw new Error("Different measurement kind");
  const cases = array(value.cases);
  const actual = {
    passed: 0,
    failed: 0,
    error: 0,
    skipped: 0,
    total: cases.length,
  };
  const rows = cases.map((item) => {
    const record = object(item);
    const status = text(record.outcome);
    if (
      status !== "passed" &&
      status !== "failed" &&
      status !== "error" &&
      status !== "skipped"
    )
      throw new Error("Invalid test outcome");
    actual[status] += 1;
    return {
      name: text(record.name),
      status,
      description: [
        ...array(record.suite).map(text),
        ...array(record.messages).map(text),
      ].join(" · "),
    };
  });
  for (const key of [
    "passed",
    "failed",
    "error",
    "skipped",
    "total",
  ] as const) {
    if (actual[key] !== evidence.measurement.counts[key])
      throw new Error("Test details differ from the overview counts");
  }
  const priority: Record<string, number> = {
    error: 0,
    failed: 1,
    skipped: 2,
    passed: 3,
  };
  return rows.sort(
    (left, right) => priority[left.status]! - priority[right.status]!,
  );
}

function coverageRows(
  value: Record<string, unknown>,
  evidence: QualityOverviewEvidence,
): DetailRow[] {
  if (evidence.measurement?.kind !== "coverage")
    throw new Error("Different measurement kind");
  const files = array(value.files);
  if (files.length !== evidence.measurement.files)
    throw new Error("Coverage file inventory differs");
  const aggregate = count(value.lineCoverage);
  if (
    aggregate.total !== evidence.measurement.lineCoverage.total ||
    aggregate.covered !== evidence.measurement.lineCoverage.covered
  )
    throw new Error("Coverage details differ from the overview");
  return files.map((item) => {
    const record = object(item);
    return {
      name: text(record.path),
      status: "measured",
      description: `Lines ${coverageLabel(count(record.lineCoverage))}; branches ${coverageLabel(record.branchCoverage === null ? null : count(record.branchCoverage))}`,
    };
  });
}

export function parseDetailRows(
  value: unknown,
  evidence: QualityOverviewEvidence,
): DetailRow[] {
  const record = object(value);
  const subject = object(record.subject);
  const run = object(record.run);
  const source = object(record.source);
  if (
    record.schemaVersion !== 1 ||
    record.id !== evidence.id ||
    subject.repository !== evidence.subject.repository ||
    subject.revision !== evidence.subject.revision ||
    run.id !== evidence.run?.id ||
    run.url !== evidence.run?.url ||
    run.completedAt !== evidence.run?.completedAt ||
    source.sha256 !== evidence.source?.sha256
  )
    throw new Error("Detail provenance differs from the overview");
  const measurement = object(record.measurement);
  if (measurement.kind === "tests") return testRows(measurement, evidence);
  if (measurement.kind === "coverage")
    return coverageRows(measurement, evidence);
  throw new Error("Unsupported detail measurement");
}
