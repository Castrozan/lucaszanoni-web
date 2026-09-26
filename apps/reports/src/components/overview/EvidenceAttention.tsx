import type { QualityOverviewEvidence } from "@platform/ingestion-contracts";
import { evidenceStatus } from "../../data/overview/evidence-status";
import { EvidenceBadge } from "./EvidenceBadge";

export function EvidenceAttention({
  evidence,
  now,
}: {
  readonly evidence: readonly QualityOverviewEvidence[];
  readonly now: number;
}) {
  const attention = evidence.filter(
    (item) =>
      !["passed", "measured", "unmeasured", "unsupported"].includes(
        evidenceStatus(item, now),
      ),
  );
  return (
    <section
      className="my-5 rounded-lg border border-border border-l-2 border-l-status-caution p-4"
      aria-label="Evidence needing attention"
    >
      <h2 className="font-medium">
        Failures and evidence needing attention{" "}
        <span className="text-muted-foreground">({attention.length})</span>
      </h2>
      {attention.length ? (
        <ul className="mt-3 grid gap-3 md:grid-cols-2">
          {attention.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-2 text-sm"
            >
              <a
                href={`#evidence-${item.id}`}
                className="text-primary underline"
              >
                {item.label}
              </a>
              <EvidenceBadge status={evidenceStatus(item, now)} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          No failing or invalid result is recorded among the measured inputs.
          Unmeasured capabilities remain listed separately.
        </p>
      )}
    </section>
  );
}
