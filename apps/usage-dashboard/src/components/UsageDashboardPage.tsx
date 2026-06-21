import { REPORTS_MOUNT_PATH } from "@platform/config";
import { Card } from "@platform/design-system";
import type { UsageViewModel } from "@platform/snapshot-data";
import { StatCards } from "./StatCards";
import { DailyTokensChart } from "./DailyTokensChart";
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
}: Pick<
  UsageDashboardPageProps,
  "errorMessage" | "isLoading" | "lastUpdatedLabel"
>) {
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
  return (
    <div className={liveStatusClassName}>
      <span
        className={`${statusDotClassName} animate-live-pulse bg-status-positive`}
      ></span>
      <span>live · updated {lastUpdatedLabel}</span>
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
        />
      </header>

      <p className={ledeClassName}>
        Claude Code token consumption per account, pulled live from each
        machine's <code>stats-cache.json</code> snapshot in Cloud Storage. Every
        account is an opaque salted hash of its id, so the numbers are public
        but the accounts are not. The headline number is cache-read tokens: on a
        prompt-cached model they dwarf fresh input and are what actually burns
        the plan.
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
              Claude Code reuses a cached prefix across turns, so almost every
              token a long session reads is a <b>cache-read</b>, not fresh
              input. That is why the lever that matters is cutting repeated
              context, not trimming prompts: the cache-read column below is the
              cost.
            </p>
          </Card>

          <h2 className={sectionHeadingClassName}>
            OpenTelemetry token stream
          </h2>
          <p className={ledeClassName}>
            A local OpenTelemetry collector on every machine receives Claude
            Code's <code>claude_code.token.usage</code> metric and writes it to
            a rotating local file. Each machine folds the aggregated counts
            (never the account id) into its snapshot, so this is a live,
            type-resolved view that corroborates the cache-read story above.
          </p>
          <OtelPanel otelMetrics={viewModel.summary.otel_metrics} />

          <h2 className={sectionHeadingClassName}>Per-account totals</h2>
          <AccountTable accounts={viewModel.accounts} />

          <h2 className={sectionHeadingClassName}>The memory-recall lever</h2>
          <p className={ledeClassName}>
            The memory-recall hook injects relevant memory files into a turn,
            then suppresses the injection when the same set was already shown
            (dedup), when a per-session budget is spent, or when nothing changed
            (debounce). Those suppressions are the directly attributable savings
            folded into each snapshot.
          </p>

          <h2 className={sectionHeadingClassName}>
            Honest caveat on attribution
          </h2>
          <Card className="gap-0 rounded-lg px-5 py-4">
            <p className="m-0">
              A machine carries one current account, and{" "}
              <code>stats-cache.json</code> is not split by account. A machine
              that switched accounts attributes its whole local history to the
              account active now, so the early part of a series can be
              pre-switch usage. Read the recent slope as the current account's,
              not the absolute history.
            </p>
          </Card>
        </>
      ) : null}

      <footer className="mt-12 border-t border-border pt-5 text-sm text-muted-foreground">
        Served live from Cloud Run, reading anonymized per-machine snapshots
        from Cloud Storage that each machine exports with{" "}
        <code>agents/usage/export_usage_snapshot.py</code> &middot;{" "}
        <a className="text-primary" href={baselineReportUrl}>
          agent-eval baseline
        </a>
      </footer>
    </div>
  );
}
