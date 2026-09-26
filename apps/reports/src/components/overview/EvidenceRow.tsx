import type { QualityOverviewEvidence } from "@platform/ingestion-contracts";
import {
  coverageLabel,
  evidenceStatus,
  freshnessAt,
  safeEvidenceUrl,
} from "../../data/overview/evidence-status";
import { EvidenceBadge } from "./EvidenceBadge";
import { EvidenceDetails } from "./EvidenceDetails";

export function EvidenceRow({
  evidence,
  now,
  detailsBaseUrl,
}: {
  readonly evidence: QualityOverviewEvidence;
  readonly now: number;
  readonly detailsBaseUrl: string;
}) {
  const measurement = evidence.measurement;
  const freshness = freshnessAt(
    evidence.run?.completedAt,
    evidence.freshness.maxAgeSeconds,
    now,
  );
  return (
    <article
      id={`evidence-${evidence.id}`}
      className="rounded-lg border border-border bg-surface p-4"
      aria-label={evidence.label}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-medium">{evidence.label}</h3>
        <EvidenceBadge status={evidenceStatus(evidence, now)} />
      </div>
      {measurement?.kind === "tests" && (
        <p className="mt-2 tabular-nums text-sm">
          {measurement.counts.passed.toLocaleString()}/
          {measurement.counts.total.toLocaleString()} passed ·{" "}
          {measurement.counts.failed} failed · {measurement.counts.error} errors
          · {measurement.counts.skipped} skipped
        </p>
      )}
      {measurement?.kind === "artifact" && (
        <p className="mt-2 text-sm">
          {measurement.counts.pass}/{measurement.counts.expected} checks passed
          · {measurement.counts.fail} failed · {measurement.counts.error} errors
          · {measurement.counts["not-run"]} not run
        </p>
      )}
      {measurement?.kind === "coverage" && (
        <div className="mt-2 text-sm">
          <p>Lines: {coverageLabel(measurement.lineCoverage)}</p>
          <p>
            Branches: {coverageLabel(measurement.branchCoverage)} ·{" "}
            {measurement.files} files
          </p>
          <p className="text-muted-foreground">
            No pass threshold is defined for coverage.
          </p>
        </div>
      )}
      <p className="mt-2 text-xs text-muted-foreground">
        {evidence.scope.tier} · {evidence.scope.platform} ·{" "}
        {freshness === "unknown"
          ? "No current run timestamp"
          : `${freshness} · completed ${evidence.run!.completedAt}`}{" "}
        · window {evidence.freshness.maxAgeSeconds / 3600}h
      </p>
      {freshness !== "fresh" && measurement && (
        <p className="mt-1 text-xs text-muted-foreground">
          Recorded outcome: {evidence.outcome}; not current passing evidence.
        </p>
      )}
      {evidence.issues.length > 0 && (
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          {evidence.issues.map((issue, index) => (
            <li key={index}>{issue}</li>
          ))}
        </ul>
      )}
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-primary">
          Scope, provenance and checks
        </summary>
        <div className="mt-3 space-y-2 break-words text-xs text-muted-foreground">
          <p>{evidence.scope.name}</p>
          <p>
            Excluded: {evidence.scope.exclusions.join(", ") || "none declared"}
          </p>
          <p>
            Revision: <code>{evidence.subject.revision}</code>
          </p>
          {evidence.source?.sha256 && (
            <p>
              Report SHA-256: <code>{evidence.source.sha256}</code>
            </p>
          )}
          <div className="flex gap-4">
            {safeEvidenceUrl(evidence.run?.url) && (
              <a
                className="text-primary underline"
                href={safeEvidenceUrl(evidence.run?.url)}
              >
                Producing run
              </a>
            )}
            {safeEvidenceUrl(evidence.source?.uri) && (
              <a
                className="text-primary underline"
                href={safeEvidenceUrl(evidence.source?.uri)}
              >
                Raw evidence
              </a>
            )}
          </div>
          {measurement?.kind === "artifact" &&
            measurement.cases.map((item) => (
              <div key={item.id} className="border-t border-border pt-2">
                <p className="flex flex-wrap items-center gap-2">
                  <code>{item.id}</code>
                  <EvidenceBadge status={item.status} />
                </p>
                <p>
                  {item.kind} · {item.durationMs}ms
                </p>
                <p>{item.reason}</p>
              </div>
            ))}
          {measurement && measurement.kind !== "artifact" && (
            <EvidenceDetails
              evidence={evidence}
              detailsBaseUrl={detailsBaseUrl}
            />
          )}
        </div>
      </details>
    </article>
  );
}
