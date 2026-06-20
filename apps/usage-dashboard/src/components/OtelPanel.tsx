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
      <div className="panel">
        <p>
          The local OpenTelemetry collector runs on every machine, but no
          metrics interval has been flushed yet. Real-time token counts by type
          appear here once Claude Code exports its first batch.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="chips">
        {buildOtelChips(otelMetrics).map((chip) => (
          <span className="chip" key={chip.label}>
            {chip.label}: {chip.value}
          </span>
        ))}
      </div>
      <div className="panel">
        <p>
          Live token counts straight from Claude Code's OpenTelemetry stream,
          aggregated across machines and independent of the stats-cache series
          above. Notional cost on the stream:{" "}
          <b>${formatOtelTotalCost(otelMetrics)}</b>.
        </p>
      </div>
    </>
  );
}
