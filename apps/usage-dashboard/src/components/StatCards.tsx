import { Card } from "@platform/design-system";
import {
  cacheReadSharePercent,
  formatTokenCount,
  type UsageSummary,
} from "@platform/snapshot-data";

export interface StatCardsProps {
  summary: UsageSummary;
}

interface StatCard {
  label: string;
  value: string;
  subtitle: string;
}

function buildStatCards(summary: UsageSummary): StatCard[] {
  const tokenTotals = summary.token_totals;
  return [
    {
      label: "accounts tracked",
      value: String(summary.account_count),
      subtitle: `across ${summary.machine_count} machine(s)`,
    },
    {
      label: "cache-read tokens",
      value: formatTokenCount(tokenTotals.cache_read_input_tokens),
      subtitle: "reused input context",
    },
    {
      label: "cache-read share",
      value: `${cacheReadSharePercent(tokenTotals)}%`,
      subtitle: "of all input-side tokens",
    },
  ];
}

export function StatCards({ summary }: StatCardsProps) {
  return (
    <div className="my-6 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(10rem,1fr))]">
      {buildStatCards(summary).map((card) => (
        <Card key={card.label} className="gap-1 rounded-lg p-4">
          <div className="text-2xl font-bold text-primary">{card.value}</div>
          <div className="text-xs tracking-wide text-muted-foreground uppercase">
            {card.label}
          </div>
          <div className="text-xs text-muted-foreground">{card.subtitle}</div>
        </Card>
      ))}
    </div>
  );
}
