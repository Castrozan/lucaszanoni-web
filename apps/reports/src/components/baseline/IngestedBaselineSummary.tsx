import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@platform/design-system";
import type { IngestedTestBaselineSnapshot } from "../../data/test-baseline-snapshot";

export interface IngestedBaselineSummaryProps {
  readonly snapshot: IngestedTestBaselineSnapshot;
}

function formatIngestionDate(stampedAt: string): string {
  const stampedDate = new Date(stampedAt);
  return Number.isNaN(stampedDate.valueOf())
    ? "an unknown date"
    : stampedDate.toISOString().slice(0, 16).replace("T", " ");
}

export function IngestedBaselineSummary({
  snapshot,
}: IngestedBaselineSummaryProps) {
  const { payload } = snapshot;
  return (
    <section className="mb-6 rounded-lg border border-border bg-surface px-5 py-4">
      <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
        <h2 className="text-sm tracking-wide text-muted-foreground uppercase">
          ingested run
        </h2>
        <span className="text-2xl font-semibold">
          {(payload.passRate * 100).toFixed(1)}%
        </span>
        <span className="text-muted-foreground">
          {payload.passedTests}/{payload.totalTests}
        </span>
        <code className="text-muted-foreground">{payload.commit}</code>
        <span className="text-sm text-muted-foreground">
          ingested {formatIngestionDate(snapshot.receivedAt)} UTC
        </span>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>category</TableHead>
            <TableHead>passed</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payload.categories.map((categoryResult) => (
            <TableRow key={categoryResult.category}>
              <TableCell>{categoryResult.category}</TableCell>
              <TableCell>
                {categoryResult.passed}/
                {categoryResult.passed + categoryResult.failed}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
