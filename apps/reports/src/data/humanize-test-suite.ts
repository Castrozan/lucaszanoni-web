import type { AgentEvalsTestSuite } from "./agent-evals-report";
import type { VerdictTone } from "./humanize-agent-evals-report";

export interface TestSuiteSummary {
  readonly label: string;
  readonly tone: VerdictTone;
  readonly detail: string;
}

function formatCount(count: number): string {
  return count.toLocaleString("en-US");
}

function describeSkipped(skipped: number | undefined): string {
  return skipped ? `, ${formatCount(skipped)} skipped` : "";
}

export function summarizeTestSuite(
  testSuite: AgentEvalsTestSuite,
): TestSuiteSummary {
  if (testSuite.tests === undefined) {
    return {
      label: "Tests unknown",
      tone: "caution",
      detail: "The ordinary test suite recorded no results.",
    };
  }
  const broken = (testSuite.failures ?? 0) + (testSuite.errors ?? 0);
  if (testSuite.exitCode === 0 && broken === 0) {
    return {
      label: "Tests passing",
      tone: "positive",
      detail: `All ${formatCount(testSuite.tests)} ordinary tests passed${describeSkipped(testSuite.skipped)}.`,
    };
  }
  return {
    label: "Tests failing",
    tone: "negative",
    detail:
      broken === 0
        ? `The ordinary test suite failed across ${formatCount(testSuite.tests)} tests.`
        : `${formatCount(broken)} of ${formatCount(testSuite.tests)} ordinary tests failed${describeSkipped(testSuite.skipped)}.`,
  };
}
