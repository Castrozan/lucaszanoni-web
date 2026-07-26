import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@platform/design-system";
import type { TestCoverageFileResult } from "@platform/ingestion-contracts";
import type { IngestedTestCoverageSnapshot } from "../../data/test-coverage-snapshot";
import { formatIngestionStamp } from "../ingested/ingestion-stamp-format";

export interface IngestedCoverageSummaryProps {
  readonly snapshot: IngestedTestCoverageSnapshot;
}

function formatCoverageRate(lineCoverageRate: number): string {
  return `${(lineCoverageRate * 100).toFixed(1)}%`;
}

function rankLeastCoveredFirst(
  files: readonly TestCoverageFileResult[],
): TestCoverageFileResult[] {
  return [...files].sort(
    (measuredFile, otherMeasuredFile) =>
      measuredFile.lineCoverageRate - otherMeasuredFile.lineCoverageRate,
  );
}

export function IngestedCoverageSummary({
  snapshot,
}: IngestedCoverageSummaryProps) {
  const { payload } = snapshot;
  return (
    <section className="mb-6 rounded-lg border border-border bg-surface px-5 py-4">
      <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
        <h2 className="text-sm tracking-wide text-muted-foreground uppercase">
          ingested run
        </h2>
        <span className="text-2xl font-semibold">
          {formatCoverageRate(payload.lineCoverageRate)}
        </span>
        <span className="text-muted-foreground">
          {payload.coveredLines}/{payload.measurableLines} lines
        </span>
        <code className="text-muted-foreground">{payload.commit}</code>
        <span className="text-sm text-muted-foreground">
          ingested {formatIngestionStamp(snapshot.receivedAt)} UTC
        </span>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>least covered script</TableHead>
            <TableHead>lines</TableHead>
            <TableHead>coverage</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rankLeastCoveredFirst(payload.files).map((measuredFile) => (
            <TableRow key={measuredFile.path}>
              <TableCell>{measuredFile.path}</TableCell>
              <TableCell>
                {measuredFile.coveredLines}/{measuredFile.measurableLines}
              </TableCell>
              <TableCell>
                {formatCoverageRate(measuredFile.lineCoverageRate)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
