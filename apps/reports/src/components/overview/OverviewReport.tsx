import type { QualityOverviewPayload } from "@platform/ingestion-contracts";
import { EvidenceRow } from "./EvidenceRow";
import { RunSummary } from "./RunSummary";
import { EvidenceAttention } from "./EvidenceAttention";

export function OverviewReport({
  payload,
  now,
}: {
  readonly payload: QualityOverviewPayload;
  readonly now: number;
}) {
  const { overview, workflow } = payload;
  const sections = [
    {
      title: "Delivered package",
      description:
        "Complete CI-built package, source preservation and native discovery. Each check below names its scope.",
      items: overview.evidence.filter(
        (item) =>
          (item.category === "artifact" && item.id.endsWith("-artifact")) ||
          item.id === "source-preservation",
      ),
    },
    {
      title: "Traditional tests",
      description:
        "Native test results by language and tier. Skipped tests remain separate from passes.",
      items: overview.evidence.filter((item) => item.category === "tests"),
    },
    {
      title: "Coverage and mutation",
      description:
        "Coverage measures exercised code. It does not establish assertion quality or instruction adherence.",
      items: overview.evidence.filter(
        (item) => item.category === "coverage" || item.category === "mutation",
      ),
    },
    {
      title: "Harness capability gaps",
      description:
        "Discovery, invocation, hooks, deployed installation and adherence are independent capabilities. CI does not call production services or models.",
      items: overview.evidence.filter(
        (item) =>
          item.category === "instruction" ||
          (item.category === "artifact" &&
            !item.id.endsWith("-artifact") &&
            item.id !== "source-preservation"),
      ),
    },
  ];
  return (
    <>
      <section
        className="my-6 rounded-lg border border-border bg-surface p-5"
        aria-label="Producing workflow"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-semibold">
            Producing workflow: {workflow.conclusion.replaceAll("_", " ")}
          </h2>
          <a className="text-sm text-primary underline" href={workflow.runUrl}>
            Run {workflow.runId}, attempt {workflow.runAttempt}
          </a>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          The pipeline verdict is separate from the individual measurements
          below.
        </p>
        <p className="mt-3 break-all text-xs">
          Revision{" "}
          <a
            className="text-primary underline"
            href={`https://github.com/${workflow.repository}/commit/${workflow.revision}`}
          >
            {workflow.revision}
          </a>
        </p>
        <p className="mt-2 break-all text-xs">
          Package SHA-256:{" "}
          {overview.subject.artifactDigest ??
            "unavailable; no package identity asserted"}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Workflow completed {workflow.completedAt} · Overview assembled{" "}
          {overview.generatedAt}
        </p>
      </section>
      <RunSummary evidence={overview.evidence} now={now} />
      <EvidenceAttention evidence={overview.evidence} now={now} />
      <nav
        className="flex flex-wrap gap-4 text-sm text-primary"
        aria-label="Overview sections"
      >
        {sections.map((section, index) => (
          <a
            key={section.title}
            href={`#evidence-section-${index}`}
            className="underline"
          >
            {section.title}
          </a>
        ))}
      </nav>
      {sections.map((section, index) => (
        <section
          key={section.title}
          id={`evidence-section-${index}`}
          className="mt-8 scroll-mt-5"
        >
          <h2 className="text-lg font-semibold">{section.title}</h2>
          <p className="mt-1 mb-4 max-w-[85ch] text-sm text-muted-foreground">
            {section.description}
          </p>
          <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {section.items.map((evidence) => (
              <EvidenceRow
                key={evidence.id}
                evidence={evidence}
                now={now}
                detailsBaseUrl={payload.detailsBaseUrl}
              />
            ))}
          </div>
          {section.items.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No evidence declared in this snapshot.
            </p>
          )}
        </section>
      ))}
      <details className="mt-8 border-t border-border pt-4 text-sm text-muted-foreground">
        <summary className="cursor-pointer">Measurement limits</summary>
        <ul className="mt-3 space-y-2">
          {overview.limits.map((limit) => (
            <li key={limit}>{limit}</li>
          ))}
        </ul>
      </details>
    </>
  );
}
