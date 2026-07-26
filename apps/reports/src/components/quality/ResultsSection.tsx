import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@platform/design-system";
import type { TestQualityInstructionLoadingCategory } from "@platform/ingestion-contracts";
import type { QualityMetrics } from "../../data/quality-metrics";
import {
  baselineDashboardHref,
  formatKebabLabelAsSentenceTitle,
  qualityContentLinkClassName,
  qualityLedeClassName,
  qualitySectionHeadingClassName,
} from "./quality-report-content";

const significantVerdictClassName = "font-semibold text-primary";
const inconclusiveVerdictClassName = "text-muted-foreground";

export interface ResultsSectionProps {
  readonly metrics: QualityMetrics;
}

function formatRateAsPercent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

function formatDeltaAsPercentagePoints(delta: number): string {
  const points = (delta * 100).toFixed(1);
  return delta < 0 ? `${points} pts` : `+${points} pts`;
}

function readWidestMeasuredCategory(
  categories: readonly TestQualityInstructionLoadingCategory[],
): TestQualityInstructionLoadingCategory {
  return categories.reduce((widest, category) =>
    Math.abs(category.delta) > Math.abs(widest.delta) ? category : widest,
  );
}

function ExperimentRow({
  category,
}: {
  readonly category: TestQualityInstructionLoadingCategory;
}) {
  return (
    <TableRow>
      <TableCell>
        {formatKebabLabelAsSentenceTitle(category.category)}
      </TableCell>
      <TableCell data-experiment-paired-tests={String(category.pairedTests)}>
        {category.pairedTests}
      </TableCell>
      <TableCell>
        {formatRateAsPercent(category.passRateWithInstructions)}
      </TableCell>
      <TableCell>
        {formatRateAsPercent(category.passRateWithoutInstructions)}
      </TableCell>
      <TableCell>{formatDeltaAsPercentagePoints(category.delta)}</TableCell>
      <TableCell>{category.exactPValue}</TableCell>
      <TableCell
        className={
          category.significant
            ? significantVerdictClassName
            : inconclusiveVerdictClassName
        }
        data-experiment-significant={String(category.significant)}
      >
        {category.significant ? "significant" : "not significant"}
      </TableCell>
    </TableRow>
  );
}

export function ResultsSection({ metrics }: ResultsSectionProps) {
  const experiment = metrics.instructionLoadingExperiment;
  const significantCategoryCount = experiment.categories.filter(
    (category) => category.significant,
  ).length;
  const widestCategory = readWidestMeasuredCategory(experiment.categories);
  const currentPassRatePercent = (metrics.staticEvals.passRate * 100).toFixed(
    1,
  );
  return (
    <>
      <h2 className={qualitySectionHeadingClassName}>Results</h2>
      <p className={qualityLedeClassName}>
        The suite runs each eval twice over the same task, once with the agent
        instruction surfaces loaded and once with them stripped, and pairs the
        two runs test by test. The exact p-value is McNemar's over the
        discordant pairs, taken at an alpha of {experiment.significanceAlpha}.
        Every number below is measured on the repo at commit{" "}
        {experiment.recordedCommit} and carried in the same contracted snapshot
        as the counts above:
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>category</TableHead>
            <TableHead>paired tests</TableHead>
            <TableHead>instructions loaded</TableHead>
            <TableHead>instructions stripped</TableHead>
            <TableHead>delta</TableHead>
            <TableHead>p</TableHead>
            <TableHead>verdict</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {experiment.categories.map((category) => (
            <ExperimentRow category={category} key={category.category} />
          ))}
        </TableBody>
      </Table>
      <p className={qualityLedeClassName}>
        {significantCategoryCount} of {experiment.categories.length} categories
        clear that alpha on their own, and the largest measured effect is{" "}
        {formatDeltaAsPercentagePoints(widestCategory.delta)} on{" "}
        {formatKebabLabelAsSentenceTitle(widestCategory.category)}, so over a
        set this small the honest reading is a direction rather than a proven
        effect. The static evals behind it sit at {currentPassRatePercent}% (
        {metrics.staticEvals.passedTests}/{metrics.staticEvals.totalTests}), and
        the{" "}
        <a className={qualityContentLinkClassName} href={baselineDashboardHref}>
          baseline dashboard
        </a>{" "}
        plots every recorded run.
      </p>
    </>
  );
}
