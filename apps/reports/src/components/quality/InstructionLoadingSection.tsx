import { instructionLoadingDiagram } from "./quality-report-content";

export function InstructionLoadingSection() {
  return (
    <>
      <h2>Instruction loading</h2>
      <pre className="diagram">{instructionLoadingDiagram}</pre>
    </>
  );
}
