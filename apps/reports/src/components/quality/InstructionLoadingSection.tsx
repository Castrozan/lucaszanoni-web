import type { CoreRulesMetrics } from "../../data/quality-metrics";
import {
  buildInstructionLoadingDiagram,
  qualitySectionHeadingClassName,
} from "./quality-report-content";

export interface InstructionLoadingSectionProps {
  readonly coreRules: CoreRulesMetrics;
}

export function InstructionLoadingSection({
  coreRules,
}: InstructionLoadingSectionProps) {
  return (
    <>
      <h2 className={qualitySectionHeadingClassName}>Instruction loading</h2>
      <pre className="overflow-x-auto rounded-lg border border-border bg-surface px-5 py-4 text-[0.8rem] leading-relaxed text-muted-foreground">
        {buildInstructionLoadingDiagram(coreRules)}
      </pre>
    </>
  );
}
