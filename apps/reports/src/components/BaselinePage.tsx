import { useAgentEvalsReport } from "../data/agent-evals-report";
import { BaselineVerdict } from "./baseline/BaselineVerdict";
import { CategoryStandingSection } from "./baseline/CategoryStandingSection";
import { FailingCasesSection } from "./baseline/FailingCasesSection";
import { FailureReasonsSection } from "./baseline/FailureReasonsSection";
import { MoreDetailSection } from "./baseline/MoreDetailSection";
import { TechnicalReportLink } from "./baseline/TechnicalReportLink";
import { baselineMutedTextClassName } from "./baseline/baseline-report-content";

export function BaselinePage() {
  const reportState = useAgentEvalsReport();
  return (
    <div>
      <h1 className="mt-2 mb-4 text-2xl font-semibold">
        agent instructions report
      </h1>
      {reportState.phase === "loading" ? (
        <p className={baselineMutedTextClassName}>
          loading the latest measurement…
        </p>
      ) : null}
      {reportState.phase === "error" ? (
        <p className={baselineMutedTextClassName}>
          the latest measurement could not be loaded · <TechnicalReportLink />
        </p>
      ) : null}
      {reportState.phase === "ready" ? (
        <>
          <BaselineVerdict header={reportState.report.header} />
          {reportState.report.header.status === "approved" ? null : (
            <FailureReasonsSection
              reasons={reportState.report.header.reasons}
            />
          )}
          <CategoryStandingSection categories={reportState.report.categories} />
          <FailingCasesSection failures={reportState.report.failures} />
          <MoreDetailSection
            flaky={reportState.report.flaky}
            uncovered={reportState.report.uncovered}
          />
        </>
      ) : null}
    </div>
  );
}
