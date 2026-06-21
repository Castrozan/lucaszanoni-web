import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@platform/design-system";
import { useOwnerAccessIdentity } from "../identity/use-owner-access-identity";
import { cockpitQuickAccessBookmarks } from "../layout/cockpit-quick-access-bookmarks";

export function CockpitDashboardPage() {
  const ownerAccessIdentity = useOwnerAccessIdentity();
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
          One edge, your apps. Quick access on the left; live usage and data
          below.
        </p>
      </header>

      <section
        aria-label="Quick access"
        className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(13rem,1fr))]"
      >
        {cockpitQuickAccessBookmarks.map((bookmark) => (
          <a
            key={bookmark.id}
            href={bookmark.href}
            {...(bookmark.opensInNewTab
              ? { target: "_blank", rel: "noreferrer" }
              : {})}
            className="block rounded-lg border border-border bg-surface px-5 py-4 text-inherit no-underline transition-colors hover:border-primary"
          >
            <div className="text-[1.05rem] font-semibold text-primary">
              {bookmark.label}
            </div>
            <div className="mt-1.5 text-sm text-muted-foreground">
              {bookmark.description}
            </div>
          </a>
        ))}
      </section>

      <section aria-label="Usage and data">
        <Card>
          <CardHeader>
            <CardTitle>Usage &amp; data</CardTitle>
            <CardDescription>
              Live charts wire up in a later slice.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 items-center justify-center rounded-md border border-dashed border-border font-mono text-xs uppercase tracking-[2px] text-text-faint">
              charts placeholder
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
