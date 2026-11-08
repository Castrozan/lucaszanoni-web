import { Badge, cn } from "@platform/design-system";
import type { AgentEvalsCategory } from "../../data/agent-evals-report";
import {
  buildCategoryRows,
  countNoun,
  describeCaseRuns,
  formatPercent,
  humanizeName,
  type CategoryRow,
} from "../../data/humanize-agent-evals-report";
import { qualitySectionHeadingClassName } from "../quality/quality-report-content";
import {
  baselineBelowFloorClassName,
  baselineMutedTextClassName,
  baselineRowClassName,
  baselineSummaryClassName,
} from "./baseline-report-content";

function RateBar({ row }: { readonly row: CategoryRow }) {
  return (
    <div className="hidden h-1.5 rounded-full bg-surface-raised sm:block">
      <div
        className={cn(
          "h-full rounded-full",
          row.belowFloor ? "bg-status-negative" : "bg-status-positive",
        )}
        style={{ width: `${Math.round((row.rate ?? 0) * 100)}%` }}
      />
    </div>
  );
}

function CategoryRowSummary({ row }: { readonly row: CategoryRow }) {
  return (
    <>
      <span className={cn("truncate", row.belowFloor && "font-medium")}>
        {row.name}
      </span>
      <RateBar row={row} />
      <span
        className={cn(
          "text-right font-semibold",
          row.belowFloor && baselineBelowFloorClassName,
        )}
      >
        {row.rate === null ? "n/a" : formatPercent(row.rate)}
      </span>
      <span
        className={cn(
          "text-right whitespace-nowrap",
          baselineMutedTextClassName,
        )}
      >
        {row.passes} of {row.samples}
      </span>
    </>
  );
}

function NonPassingCaseList({ row }: { readonly row: CategoryRow }) {
  return (
    <ul className="mb-2 space-y-1 pl-4">
      {row.nonPassingCases.map((measuredCase) => (
        <li
          key={measuredCase.key}
          className="flex flex-wrap items-center gap-2"
        >
          <span>{humanizeName(measuredCase.name)}</span>
          <span className={baselineMutedTextClassName}>
            {describeCaseRuns(measuredCase)}
          </span>
          {measuredCase.flaky ? <Badge variant="outline">flaky</Badge> : null}
        </li>
      ))}
    </ul>
  );
}

function CategoryStandingRow({ row }: { readonly row: CategoryRow }) {
  if (row.nonPassingCases.length === 0) {
    return (
      <div className={cn(baselineRowClassName, "border-b border-border")}>
        <CategoryRowSummary row={row} />
      </div>
    );
  }
  return (
    <details className="border-b border-border">
      <summary className={cn(baselineSummaryClassName, baselineRowClassName)}>
        <CategoryRowSummary row={row} />
      </summary>
      <NonPassingCaseList row={row} />
    </details>
  );
}

export function CategoryStandingSection({
  categories,
}: {
  readonly categories: readonly AgentEvalsCategory[];
}) {
  const rows = buildCategoryRows(categories);
  const imperfectRows = rows.filter((row) => row.rate !== 1);
  const perfectRows = rows.filter((row) => row.rate === 1);
  return (
    <section>
      <h2 className={qualitySectionHeadingClassName}>where it stands</h2>
      <div className="border-t border-border">
        {imperfectRows.map((row) => (
          <CategoryStandingRow key={row.name} row={row} />
        ))}
      </div>
      {perfectRows.length === 0 ? null : (
        <details className="mt-3">
          <summary
            className={cn(baselineSummaryClassName, baselineMutedTextClassName)}
          >
            {countNoun(
              perfectRows.length,
              "more area passes",
              "more areas pass",
            )}{" "}
            every check
          </summary>
          <div className="mt-2 border-t border-border">
            {perfectRows.map((row) => (
              <CategoryStandingRow key={row.name} row={row} />
            ))}
          </div>
        </details>
      )}
    </section>
  );
}
