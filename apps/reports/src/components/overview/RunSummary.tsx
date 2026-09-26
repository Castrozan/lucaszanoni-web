import type { QualityOverviewEvidence } from "@platform/ingestion-contracts";
import {
  coverageLabel,
  evidenceStatus,
} from "../../data/overview/evidence-status";
import { EvidenceBadge } from "./EvidenceBadge";

export function RunSummary({
  evidence,
  now,
}: {
  readonly evidence: readonly QualityOverviewEvidence[];
  readonly now: number;
}) {
  const artifacts = evidence.filter(
    (item) =>
      item.category === "artifact" &&
      (item.id.endsWith("-artifact") || item.id === "source-preservation"),
  );
  const passingArtifacts = artifacts.filter(
    (item) => evidenceStatus(item, now) === "passed",
  ).length;
  const tests = evidence.filter((item) => item.measurement?.kind === "tests");
  const coverage = evidence.find((item) => item.id === "python-coverage");
  const gaps = evidence.filter(
    (item) => item.validity === "unmeasured" || item.validity === "unsupported",
  );
  return (
    <section
      className="my-5 grid overflow-hidden rounded-lg border border-border bg-surface lg:grid-cols-3"
      aria-label="Independent measurement summary"
    >
      <div className="border-b border-border p-5 lg:border-r lg:border-b-0">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Package evidence
        </h2>
        <p className="mt-5 font-mono text-4xl tabular-nums">
          {passingArtifacts}
          <span className="text-xl text-muted-foreground">
            /{artifacts.length}
          </span>
        </p>
        <p className="mt-2 text-sm">Reports with current passing evidence</p>
        <p className="mt-4 text-xs text-muted-foreground">
          Emitted package only. Deployed installations and model behavior need
          separate evidence.
        </p>
        <a
          href="#evidence-section-3"
          className="mt-4 inline-block text-sm text-status-caution underline"
        >
          {gaps.length} explicitly unmeasured or unsupported items
        </a>
      </div>
      <div className="border-b border-border p-5 lg:border-r lg:border-b-0">
        <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Test tiers
        </h2>
        <div className="space-y-4">
          {tests.map((item) => (
            <div key={item.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
                <a href={`#evidence-${item.id}`} className="text-primary">
                  {item.label}
                </a>
                <EvidenceBadge status={evidenceStatus(item, now)} />
              </div>
              <p className="mt-1 text-sm tabular-nums">
                {item.measurement?.kind === "tests" &&
                  `${item.measurement.counts.passed.toLocaleString()}/${item.measurement.counts.total.toLocaleString()} passed`}
              </p>
            </div>
          ))}
        </div>
        {!tests.length && (
          <p className="text-sm text-muted-foreground">
            No measured test tiers in this snapshot.
          </p>
        )}
      </div>
      <div className="p-5">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Python coverage
        </h2>
        {coverage?.measurement?.kind === "coverage" ? (
          <>
            <p className="mt-5 font-mono text-2xl tabular-nums">
              {coverageLabel(coverage.measurement.lineCoverage)}
            </p>
            <p className="mt-2 text-sm">
              Lines · {coverage.measurement.files} files
            </p>
            <p className="mt-3 text-sm">
              Branches: {coverageLabel(coverage.measurement.branchCoverage)}
            </p>
            <div className="mt-3">
              <EvidenceBadge status={evidenceStatus(coverage, now)} />
            </div>
          </>
        ) : (
          <p className="mt-5 text-sm text-muted-foreground">
            {coverage
              ? evidenceStatus(coverage, now)
              : "No declared Python coverage"}
          </p>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Scoped measurement, without an implied pass threshold. Test outcomes
          and artifact checks remain separate.
        </p>
      </div>
    </section>
  );
}
