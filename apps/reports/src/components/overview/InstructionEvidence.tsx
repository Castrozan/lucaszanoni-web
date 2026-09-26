import { REPORTS_MOUNT_PATH } from "@platform/config";
import {
  testBaselineContract,
  testQualityContract,
} from "@platform/ingestion-contracts";
import { useOverviewSnapshot } from "../../data/overview/snapshot";

function RecordedAt({
  value,
  now,
}: {
  readonly value: string;
  readonly now: number;
}) {
  const age = now - Date.parse(value);
  return (
    <p className="mt-2 text-xs text-muted-foreground">
      Recorded {value} ·{" "}
      {Number.isFinite(age) && age >= 0
        ? `${(age / 86400000).toFixed(1)} days old`
        : "age unknown"}
      . Freshness is governed by that report's evidence policy.
    </p>
  );
}

export function InstructionEvidence({ now }: { readonly now: number }) {
  const baseline = useOverviewSnapshot(testBaselineContract);
  const quality = useOverviewSnapshot(testQualityContract);
  const experiment =
    quality.status === "ready"
      ? quality.payload.instructionLoadingExperiment
      : null;
  return (
    <section className="mt-8 border-t border-border pt-6">
      <h2 className="text-lg font-semibold">Instruction effectiveness</h2>
      <p className="mt-1 mb-4 max-w-[85ch] text-sm text-muted-foreground">
        Separately recorded evaluations. Their dates and revisions are
        independent of the package and test workflow above.
      </p>
      <div className="grid gap-3 lg:grid-cols-2">
        <article className="rounded-lg border border-border bg-surface p-4">
          <h3 className="font-medium">
            <a
              className="text-primary underline"
              href={`${REPORTS_MOUNT_PATH}baseline/`}
            >
              Agent-eval baseline
            </a>
          </h3>
          {baseline.status === "ready" ? (
            <>
              <p className="mt-2 text-sm">
                {baseline.payload.passedTests}/{baseline.payload.totalTests}{" "}
                recorded passes · {baseline.payload.failedTests} failures
              </p>
              <p className="mt-2 break-all text-xs">
                Recorded revision: {baseline.payload.commit}
              </p>
              <RecordedAt value={baseline.payload.recordedAt} now={now} />
              {baseline.payload.oldestEvidenceAt && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Oldest retained evidence: {baseline.payload.oldestEvidenceAt}
                </p>
              )}
            </>
          ) : (
            <p className="mt-2 text-sm">Baseline evidence {baseline.status}.</p>
          )}
        </article>
        <article className="rounded-lg border border-border bg-surface p-4">
          <h3 className="font-medium">
            <a
              className="text-primary underline"
              href={`${REPORTS_MOUNT_PATH}quality/`}
            >
              Paired instruction-loading experiment
            </a>
          </h3>
          {experiment ? (
            <>
              <p className="mt-2 text-sm">
                {experiment.categories.length} categories · alpha{" "}
                {experiment.significanceAlpha}. The linked report retains sample
                counts, effect sizes and exact p-values.
              </p>
              <p className="mt-2 break-all text-xs">
                Recorded revision: {experiment.recordedCommit}
              </p>
              <RecordedAt value={experiment.recordedAt} now={now} />
              <p className="mt-2 text-xs text-muted-foreground">
                An experiment's existence is not evidence of improvement.
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm">
              Experiment evidence {quality.status}.
            </p>
          )}
        </article>
      </div>
    </section>
  );
}
