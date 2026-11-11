import { cn } from "@platform/design-system";
import type { AgentEvalsFailure } from "../../data/agent-evals-report";
import {
  describeRuns,
  humanizeCategoryName,
  humanizeName,
} from "../../data/humanize-agent-evals-report";
import { qualitySectionHeadingClassName } from "../quality/quality-report-content";
import {
  baselineMutedTextClassName,
  baselineSummaryClassName,
} from "./baseline-report-content";
import { ReportCodeBlock } from "./ReportCodeBlock";

function FailureDetail({ failure }: { readonly failure: AgentEvalsFailure }) {
  return (
    <div className="pb-3">
      {failure.input ? (
        <ReportCodeBlock label="asked" content={failure.input} />
      ) : null}
      {failure.expected.length > 0 ? (
        <ReportCodeBlock
          label="expected"
          content={failure.expected.join("\n")}
        />
      ) : null}
      {failure.actualOutput ? (
        <ReportCodeBlock
          label="got"
          content={failure.actualOutput}
          scrollable
        />
      ) : null}
      {failure.failedAssertions.length > 0 ? (
        <ReportCodeBlock
          label="failed checks"
          content={failure.failedAssertions.join("\n")}
        />
      ) : null}
    </div>
  );
}

const failureRowClassName = "flex flex-wrap items-baseline gap-x-3 py-2";

function FailureSummary({ failure }: { readonly failure: AgentEvalsFailure }) {
  return (
    <>
      <span>{humanizeName(failure.name)}</span>
      <span className={baselineMutedTextClassName}>
        {humanizeCategoryName(failure.category)}
      </span>
      <span className={baselineMutedTextClassName}>
        {describeRuns(failure.passes, failure.samples)}
      </span>
    </>
  );
}

export function FailingCasesSection({
  failures,
}: {
  readonly failures: readonly AgentEvalsFailure[];
}) {
  if (failures.length === 0) {
    return null;
  }
  return (
    <section>
      <h2 className={qualitySectionHeadingClassName}>what is failing</h2>
      <div className="border-t border-border">
        {failures.map((failure) =>
          failure.inherited ? (
            <div
              key={failure.key}
              className={cn(failureRowClassName, "border-b border-border")}
            >
              <FailureSummary failure={failure} />
              <span className={baselineMutedTextClassName}>
                from an earlier run
              </span>
            </div>
          ) : (
            <details key={failure.key} className="border-b border-border">
              <summary
                className={cn(baselineSummaryClassName, failureRowClassName)}
              >
                <FailureSummary failure={failure} />
              </summary>
              <FailureDetail failure={failure} />
            </details>
          ),
        )}
      </div>
    </section>
  );
}
