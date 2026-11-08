import type {
  AgentEvalsFlakyCase,
  AgentEvalsUncoveredFile,
} from "../../data/agent-evals-report";
import {
  countNoun,
  groupUncoveredByKind,
  humanizeCaseKey,
} from "../../data/humanize-agent-evals-report";
import { qualityListClassName } from "../quality/quality-report-content";
import {
  baselineMutedTextClassName,
  baselineSummaryClassName,
} from "./baseline-report-content";
import { TechnicalReportLink } from "./TechnicalReportLink";

function FlakyCases({
  flaky,
}: {
  readonly flaky: readonly AgentEvalsFlakyCase[];
}) {
  if (flaky.length === 0) {
    return null;
  }
  return (
    <details className="mt-3">
      <summary className={baselineSummaryClassName}>
        {countNoun(flaky.length, "case", "cases")} passed sometimes and failed
        other times
      </summary>
      <ul className={qualityListClassName}>
        {flaky.map((flakyCase) => (
          <li key={flakyCase.key}>{humanizeCaseKey(flakyCase.key)}</li>
        ))}
      </ul>
    </details>
  );
}

function UncoveredFiles({
  uncovered,
}: {
  readonly uncovered: readonly AgentEvalsUncoveredFile[];
}) {
  if (uncovered.length === 0) {
    return null;
  }
  return (
    <details className="mt-3">
      <summary className={baselineSummaryClassName}>
        {countNoun(uncovered.length, "file has", "files have")} no case yet
      </summary>
      {groupUncoveredByKind(uncovered).map((group) => (
        <div key={group.label} className="mt-2">
          <p className={baselineMutedTextClassName}>
            {group.paths.length} {group.label}
          </p>
          <ul className={qualityListClassName}>
            {group.paths.map((path) => (
              <li key={path} className="break-all">
                {path}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </details>
  );
}

export function MoreDetailSection({
  flaky,
  uncovered,
}: {
  readonly flaky: readonly AgentEvalsFlakyCase[];
  readonly uncovered: readonly AgentEvalsUncoveredFile[];
}) {
  return (
    <details className="mt-9 border-t border-border pt-3">
      <summary className={`${baselineSummaryClassName} text-primary`}>
        more detail
      </summary>
      <FlakyCases flaky={flaky} />
      <UncoveredFiles uncovered={uncovered} />
      <p className="mt-4">
        <TechnicalReportLink />
      </p>
    </details>
  );
}
