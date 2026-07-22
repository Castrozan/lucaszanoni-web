import {
  formatMetricsGeneratedDate,
  useQualityMetrics,
} from "../data/quality-metrics";
import {
  qualityContentLinkClassName,
  qualityIssueHref,
  qualityLedeClassName,
} from "./quality/quality-report-content";
import { WhyItExistsSection } from "./quality/WhyItExistsSection";
import { InstructionLoadingSection } from "./quality/InstructionLoadingSection";
import { TestingPyramidSection } from "./quality/TestingPyramidSection";
import { ResultsSection } from "./quality/ResultsSection";
import { PromptEngineeringStrategySection } from "./quality/PromptEngineeringStrategySection";
import { WhatChangedSection } from "./quality/WhatChangedSection";
import { QualityReportFooter } from "./quality/QualityReportFooter";

export function QualityPage() {
  const metrics = useQualityMetrics();
  return (
    <div>
      <h1 className="mt-2 mb-1 text-2xl font-semibold">
        how agent quality is measured
      </h1>
      <p className={qualityLedeClassName}>
        This repo treats its own AI agent like production software: a test
        pyramid, a regression gate, scored end-to-end runs, and experiments on
        how instructions are loaded. This page is the canonical record of that
        system, originally written up in{" "}
        <a className={qualityContentLinkClassName} href={qualityIssueHref}>
          issue #70
        </a>
        . The prose is written by hand; every count in it is read from the repo
        on each deploy, measured at commit{" "}
        <code>{metrics.generatedCommit}</code> on{" "}
        {formatMetricsGeneratedDate(metrics.generatedAt)}.
      </p>
      <WhyItExistsSection />
      <InstructionLoadingSection coreRules={metrics.coreRules} />
      <TestingPyramidSection metrics={metrics} />
      <ResultsSection metrics={metrics} />
      <PromptEngineeringStrategySection metrics={metrics} />
      <WhatChangedSection />
      <QualityReportFooter />
    </div>
  );
}
