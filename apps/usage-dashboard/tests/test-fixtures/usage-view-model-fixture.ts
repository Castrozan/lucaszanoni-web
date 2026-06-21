import type {
  AccountView,
  AggregatedMemoryRecallSavings,
  AggregatedOtelMetrics,
  TokenTotals,
  UsageSummary,
  UsageViewModel,
} from "@platform/snapshot-data";

const sampleTokenTotals: TokenTotals = {
  input_tokens: 1200,
  output_tokens: 8400,
  cache_read_input_tokens: 9800000,
  cache_creation_input_tokens: 64000,
  cost_usd: 92.8732,
};

const sampleMemoryRecallSavings: AggregatedMemoryRecallSavings = {
  memory_recall_session_count: 18,
  injected_recall_event_count: 240,
  injected_recall_character_total: 512000,
  suppressed_recall_event_total: 96,
  dedup_suppressed_character_total: 184000,
  suppressed_recall_event_count_by_reason: {
    budget: 40,
    dedup: 36,
    debounce: 20,
  },
};

const sampleOtelMetricsWithData: AggregatedOtelMetrics = {
  token_usage_by_type: {
    cacheRead: 9800000,
    input: 1200,
    output: 8400,
    cacheCreation: 64000,
  },
  total_cost_usd: 92.8732,
  has_data: true,
};

const firstAccount: AccountView = {
  account_label: "2c9c0c7cb164",
  machine_count: 2,
  model_usage_totals: {},
  token_totals: sampleTokenTotals,
  daily_total_tokens: { "2026-05-01": 120000, "2026-05-02": 240000 },
  memory_recall_savings: sampleMemoryRecallSavings,
  otel_metrics: sampleOtelMetricsWithData,
  first_session_date: "2026-05-01",
  last_computed_date: "2026-06-17",
};

const secondAccount: AccountView = {
  account_label: "7f1ad9e3b220",
  machine_count: 1,
  model_usage_totals: {},
  token_totals: {
    input_tokens: 600,
    output_tokens: 3200,
    cache_read_input_tokens: 4100000,
    cache_creation_input_tokens: 21000,
    cost_usd: 38.5,
  },
  daily_total_tokens: { "2026-05-01": 80000 },
  memory_recall_savings: sampleMemoryRecallSavings,
  otel_metrics: sampleOtelMetricsWithData,
  first_session_date: "2026-05-01",
  last_computed_date: "2026-06-16",
};

const sampleSummary: UsageSummary = {
  account_count: 2,
  machine_count: 2,
  token_totals: sampleTokenTotals,
  memory_recall_savings: sampleMemoryRecallSavings,
  otel_metrics: sampleOtelMetricsWithData,
  first_session_date: "2026-05-01",
  last_computed_date: "2026-06-17",
};

export const sampleUsageViewModel: UsageViewModel = {
  accounts: [firstAccount, secondAccount],
  summary: sampleSummary,
  chart: {
    dates: ["2026-05-01", "2026-05-02"],
    series: [
      { account_label: "2c9c0c7cb164", values: [120000, 240000] },
      { account_label: "7f1ad9e3b220", values: [80000, null] },
    ],
  },
};

export const emptyOtelMetrics: AggregatedOtelMetrics = {
  token_usage_by_type: {},
  total_cost_usd: 0,
  has_data: false,
};
