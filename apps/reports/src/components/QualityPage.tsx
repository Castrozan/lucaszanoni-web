import "./quality/quality-report.css";
import { qualityIssueHref } from "./quality/quality-report-content";
import { WhyItExistsSection } from "./quality/WhyItExistsSection";
import { InstructionLoadingSection } from "./quality/InstructionLoadingSection";
import { TestingPyramidSection } from "./quality/TestingPyramidSection";
import { ResultsSection } from "./quality/ResultsSection";
import { PromptEngineeringStrategySection } from "./quality/PromptEngineeringStrategySection";
import { WhatChangedSection } from "./quality/WhatChangedSection";
import { QualityReportFooter } from "./quality/QualityReportFooter";

export function QualityPage() {
  return (
    <div className="reports-page quality-report">
      <h1>how agent quality is measured</h1>
      <p className="lede">
        This repo treats its own AI agent like production software: a test
        pyramid, a regression gate, scored end-to-end runs, and experiments on
        how instructions are loaded. This page is the canonical record of that
        system, originally written up in{" "}
        <a href={qualityIssueHref}>issue #70</a>.
      </p>
      <WhyItExistsSection />
      <InstructionLoadingSection />
      <TestingPyramidSection />
      <ResultsSection />
      <PromptEngineeringStrategySection />
      <WhatChangedSection />
      <QualityReportFooter />
    </div>
  );
}
