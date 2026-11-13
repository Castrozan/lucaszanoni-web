import { REPORTS_MOUNT_PATH } from "@platform/config";
import { Card } from "@platform/design-system";
import type { UsageViewModel } from "@platform/snapshot-data";
import { DailyTokensChart } from "@platform/usage-insights";
import { StatCards } from "./StatCards";
import { OtelPanel } from "./OtelPanel";
import { AccountTable } from "./AccountTable";

export interface UsageDashboardPageProps {
  viewModel: UsageViewModel | null;
  errorMessage: string | null;
  isLoading: boolean;
  lastUpdatedLabel: string | null;
}

const baselineReportUrl = `${REPORTS_MOUNT_PATH}baseline/`;

const sectionHeadingClassName =
  "mt-10 mb-3 border-b border-border pb-1.5 text-xl font-semibold";
const ledeClassName = "text-muted-foreground";

function LiveStatus({
  errorMessage,
  isLoading,
  lastUpdatedLabel,
  hasUsageAccounts,
}: Pick<
  UsageDashboardPageProps,
  "errorMessage" | "isLoading" | "lastUpdatedLabel"
> & { hasUsageAccounts: boolean }) {
  const liveStatusClassName =
    "inline-flex items-center gap-2 text-sm text-muted-foreground";
  const statusDotClassName = "inline-block size-2.5 rounded-full";
  if (errorMessage) {
    return (
      <div className={liveStatusClassName}>
        <span className={`${statusDotClassName} bg-status-negative`}></span>
        <span>live feed unavailable</span>
      </div>
    );
  }
  if (isLoading) {
    return (
      <div className={liveStatusClassName}>
        <span className={`${statusDotClassName} bg-status-caution`}></span>
        <span>loading live snapshots</span>
      </div>
    );
  }
  if (!hasUsageAccounts) {
    return (
      <div className={liveStatusClassName}>
        <span className={`${statusDotClassName} bg-status-caution`}></span>
        <span>no usage snapshots received</span>
      </div>
    );
  }
  return (
    <div className={liveStatusClassName}>
      <span
        className={`${statusDotClassName} animate-live-pulse bg-status-positive`}
      ></span>
      <span>connected · fetched {lastUpdatedLabel}</span>
    </div>
  );
}

export function UsageDashboardPage({
  viewModel,
  errorMessage,
  isLoading,
  lastUpdatedLabel,
}: UsageDashboardPageProps) {
  return (
    <div>
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="mt-2 text-3xl font-semibold">
          token usage across accounts
        </h1>
        <LiveStatus
          errorMessage={errorMessage}
          isLoading={isLoading}
          lastUpdatedLabel={lastUpdatedLabel}
          hasUsageAccounts={Boolean(viewModel?.summary.account_count)}
        />
      </header>

      <p className={ledeClassName}>
        Private Claude Code usage metadata, collected offline with ccusage and
        published through authenticated ingestion. Account labels are opaque
        hashes; prompts and conversations are not published. Historical activity
        keeps its original source date. Reported costs are not verified billing
        totals.
      </p>

      {errorMessage ? (
        <Card className="gap-0 rounded-lg border-status-negative px-5 py-4">
          <p className="m-0">
            Could not reach the snapshot feed: {errorMessage}
          </p>
        </Card>
      ) : null}

      {viewModel ? (
        <>
          {viewModel.summary.account_count ? (
            <StatCards summary={viewModel.summary} />
          ) : null}

          <DailyTokensChart chart={viewModel.chart} />

          <h2 className={sectionHeadingClassName}>Where the tokens go</h2>
          <Card className="gap-0 rounded-lg px-5 py-4">
            <p className="m-0">
              <b>Cache-read</b> tokens measure reused context, not fresh input.
              Compare them with input, output, and cache-creation tokens; token
              volume alone does not establish cost.
            </p>
          </Card>

          <h2 className={sectionHeadingClassName}>
            OpenTelemetry token stream
          </h2>
          <p className={ledeClassName}>
            Optional OpenTelemetry counters provide a separate token-type
            breakdown when available. Collection times can differ; these
            counters do not measure billing or memory-recall savings.
          </p>
          <OtelPanel otelMetrics={viewModel.summary.otel_metrics} />

          <h2 className={sectionHeadingClassName}>Per-account totals</h2>
          <AccountTable accounts={viewModel.accounts} />

          <h2 className={sectionHeadingClassName}>The memory-recall lever</h2>
          <p className={ledeClassName}>
            This feed does not measure memory-recall savings. Token totals alone
            cannot attribute a reduction to deduplication, budgets, or debounce.
          </p>

          <h2 className={sectionHeadingClassName}>
            Honest caveat on attribution
          </h2>
          <Card className="gap-0 rounded-lg px-5 py-4">
            <p className="m-0">
              Local usage records may span account changes. Each machine labels
              its export with the current account. Older usage may belong to a
              previous account; do not read the entire history as one account.
            </p>
          </Card>
        </>
      ) : null}

      <footer className="mt-12 border-t border-border pt-5 text-sm text-muted-foreground">
        Served by private Cloudflare Workers from D1-backed per-machine
        snapshots. Authenticated producers publish metadata through the
        ingestion API. &middot;{" "}
        <a className="text-primary" href={baselineReportUrl}>
          agent instructions report
        </a>
      </footer>
    </div>
  );
}
