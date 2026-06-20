import { Badge, Card } from "@lucaszanoni-web/design-system";
import {
  OTEL_TOKEN_TYPE_LABELS,
  formatTokenCount,
  orderedOtelTokenTypes,
  type AggregatedOtelMetrics,
} from "@lucaszanoni-web/snapshot-data";

export interface OtelPanelProps {
  otelMetrics: AggregatedOtelMetrics;
}

interface OtelChip {
  label: string;
  value: string;
}

function buildOtelChips(otelMetrics: AggregatedOtelMetrics): OtelChip[] {
  const tokenUsageByType = otelMetrics.token_usage_by_type;
  return orderedOtelTokenTypes(tokenUsageByType).map((tokenType) => ({
    label: OTEL_TOKEN_TYPE_LABELS[tokenType] ?? tokenType,
    value: formatTokenCount(tokenUsageByType[tokenType] ?? 0),
  }));
}

function formatOtelTotalCost(otelMetrics: AggregatedOtelMetrics): string {
  return otelMetrics.total_cost_usd.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function OtelPanel({ otelMetrics }: OtelPanelProps) {
  if (!otelMetrics.has_data) {
    return (
      <Card className="gap-0 rounded-lg px-5 py-4">
        <p className="m-0">
          The local OpenTelemetry collector runs on every machine, but no
          metrics interval has been flushed yet. Real-time token counts by type
          appear here once Claude Code exports its first batch.
        </p>
      </Card>
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        {buildOtelChips(otelMetrics).map((chip) => (
          <Badge
            key={chip.label}
            variant="secondary"
            className="rounded-full border-border px-3 py-1 text-[0.85rem] font-normal"
          >
            {chip.label}: {chip.value}
          </Badge>
        ))}
      </div>
      <Card className="gap-0 rounded-lg px-5 py-4">
        <p className="m-0">
          Live token counts straight from Claude Code's OpenTelemetry stream,
          aggregated across machines and independent of the stats-cache series
          above. Notional cost on the stream:{" "}
          <b>${formatOtelTotalCost(otelMetrics)}</b>.
        </p>
      </Card>
    </>
  );
}
