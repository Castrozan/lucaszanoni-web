import {
  instructionLoadingDiagram,
  qualitySectionHeadingClassName,
} from "./quality-report-content";

export function InstructionLoadingSection() {
  return (
    <>
      <h2 className={qualitySectionHeadingClassName}>Instruction loading</h2>
      <pre className="overflow-x-auto rounded-lg border border-border bg-surface px-5 py-4 text-[0.8rem] leading-relaxed text-muted-foreground">
        {instructionLoadingDiagram}
      </pre>
    </>
  );
}
