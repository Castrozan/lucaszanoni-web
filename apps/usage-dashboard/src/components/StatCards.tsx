import {
  cacheReadSharePercent,
  formatTokenCount,
  type UsageSummary,
} from "@lucaszanoni-web/snapshot-data";

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
  const savings = summary.memory_recall_savings;
  return [
    {
      label: "accounts tracked",
      value: String(summary.account_count),
      subtitle: `across ${summary.machine_count} machine(s)`,
    },
    {
      label: "cache-read tokens",
      value: formatTokenCount(tokenTotals.cache_read_input_tokens),
      subtitle: "the dominant cost driver",
    },
    {
      label: "cache-read share",
      value: `${cacheReadSharePercent(tokenTotals)}%`,
      subtitle: "of all input-side tokens",
    },
    {
      label: "recall events suppressed",
      value: String(savings.suppressed_recall_event_total),
      subtitle: "budget + debounce + dedup",
    },
    {
      label: "dedup chars saved",
      value: formatTokenCount(savings.dedup_suppressed_character_total),
      subtitle: "duplicate recalls stopped",
    },
  ];
}

export function StatCards({ summary }: StatCardsProps) {
  return (
    <div className="cards">
      {buildStatCards(summary).map((card) => (
        <div className="card" key={card.label}>
          <div className="card-value">{card.value}</div>
          <div className="card-label">{card.label}</div>
          <div className="card-subtitle">{card.subtitle}</div>
        </div>
      ))}
    </div>
  );
}
