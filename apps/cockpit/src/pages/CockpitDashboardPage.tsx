import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DriveYourOwnMachineCallToAction,
} from "@platform/design-system";
import {
  DailyTokensChart,
  buildUsageHeadlineFigures,
  useUsageViewModel,
} from "@platform/usage-insights";
import { useOwnerAccessIdentity } from "../identity/use-owner-access-identity";
import { cockpitQuickAccessBookmarks } from "../layout/cockpit-quick-access-bookmarks";
import { CockpitQuickAccessTile } from "../layout/CockpitQuickAccessTile";
import { UsageKeyFigures } from "../dashboard/UsageKeyFigures";

export function CockpitDashboardPage() {
  const ownerAccessIdentity = useOwnerAccessIdentity();
  const usageViewModelState = useUsageViewModel();
  const welcomeHeadline = ownerAccessIdentity
    ? `Welcome back, ${ownerAccessIdentity.name}.`
    : "Welcome back.";
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="font-mono text-[11px] uppercase tracking-[2px] text-text-faint">
          OWNER COCKPIT
        </span>
        <h1 className="m-0 font-grotesk text-[clamp(28px,5vw,48px)] font-bold leading-none tracking-[-1px]">
          {welcomeHeadline}
        </h1>
        <p className="m-0 max-w-[60ch] font-mono text-[13px] leading-[1.6] text-muted-foreground">
          {usageViewModelState.lastUpdatedLabel
            ? `Live across your machines · updated ${usageViewModelState.lastUpdatedLabel}`
            : "Live token usage across your machines."}
        </p>
      </header>

      <UsageKeyFigures
        figures={
          usageViewModelState.viewModel
            ? buildUsageHeadlineFigures(usageViewModelState.viewModel)
            : null
        }
        isUnavailable={usageViewModelState.errorMessage !== null}
      />

      <section aria-label="Usage over time">
        <Card>
          <CardHeader>
            <CardTitle>Daily tokens</CardTitle>
            <CardDescription>
              Every account, every machine, one series per account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {usageViewModelState.errorMessage ? (
              <div className="flex h-48 items-center justify-center rounded-md border border-status-negative font-mono text-xs uppercase tracking-[2px] text-status-negative">
                live feed unavailable
              </div>
            ) : usageViewModelState.viewModel ? (
              <DailyTokensChart chart={usageViewModelState.viewModel.chart} />
            ) : (
              <div className="flex h-48 items-center justify-center rounded-md border border-dashed border-border font-mono text-xs uppercase tracking-[2px] text-text-faint">
                loading live snapshots
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section
        aria-label="Quick access"
        className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(13rem,1fr))]"
      >
        {cockpitQuickAccessBookmarks.map((bookmark) => (
          <CockpitQuickAccessTile key={bookmark.id} bookmark={bookmark} />
        ))}
      </section>

      <section aria-label="Drive your own machine">
        <DriveYourOwnMachineCallToAction />
      </section>
    </div>
  );
}
