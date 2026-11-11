import { useQualityMetrics } from "../data/quality-metrics";
import { QualityPageLede } from "./quality/QualityPageLede";
import { WhyItExistsSection } from "./quality/WhyItExistsSection";
import { InstructionLoadingSection } from "./quality/InstructionLoadingSection";
import { TestingPyramidSection } from "./quality/TestingPyramidSection";
import { ResultsSection } from "./quality/ResultsSection";
import { GoldStandardSection } from "./quality/GoldStandardSection";
import { PromptEngineeringStrategySection } from "./quality/PromptEngineeringStrategySection";
import { WhatChangedSection } from "./quality/WhatChangedSection";
import { QualityReportFooter } from "./quality/QualityReportFooter";

import { snapshotLoadStatusLabel } from "./ingested/snapshot-load-status";

export function QualityPage() {
  const state = useQualityMetrics();
  const metrics = state.status === "ready" ? state.metrics : null;
  return (
    <div>
      <h1 className="mt-2 mb-1 text-2xl font-semibold">
        how agent quality is measured
      </h1>
      <QualityPageLede metrics={metrics} />
      {state.status !== "ready" ? (
        <p role="status">{snapshotLoadStatusLabel(state.status)}</p>
      ) : null}
      <WhyItExistsSection />
      {metrics ? (
        <>
          <InstructionLoadingSection coreRules={metrics.coreRules} />
          <TestingPyramidSection metrics={metrics} />
          <ResultsSection metrics={metrics} />
          <GoldStandardSection metrics={metrics} />
          <PromptEngineeringStrategySection metrics={metrics} />
        </>
      ) : null}
      <WhatChangedSection />
      <QualityReportFooter />
    </div>
  );
}
