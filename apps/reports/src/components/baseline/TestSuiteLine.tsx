import { cn } from "@platform/design-system";
import type { AgentEvalsTestSuite } from "../../data/agent-evals-report";
import { summarizeTestSuite } from "../../data/humanize-test-suite";
import { verdictToneClassNames } from "./baseline-report-content";

export function TestSuiteLine({
  testSuite,
}: {
  readonly testSuite: AgentEvalsTestSuite;
}) {
  const summary = summarizeTestSuite(testSuite);
  return (
    <p className="mt-1 text-lg">
      <strong
        className={cn("font-semibold", verdictToneClassNames[summary.tone])}
      >
        {summary.label}.
      </strong>{" "}
      {summary.detail}
    </p>
  );
}
