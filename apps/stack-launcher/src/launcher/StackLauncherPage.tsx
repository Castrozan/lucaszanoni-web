import { findMicroFrontendRoute } from "@platform/config";
import { arrStackApps } from "./arr-stack-apps";
import {
  buildArrStackAppUrl,
  resolveArrStackFunnelHost,
  resolveArrStackPublicDomain,
  resolveArrStackTailnetHost,
} from "./arr-stack-host";
import type { ArrStackAppExposure } from "./arr-stack-apps";

const stackLauncherRoute = findMicroFrontendRoute("stack-launcher");

function ExposureBadge({ exposure }: { exposure: ArrStackAppExposure }) {
  return (
    <span className="border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[1.5px] text-text-faint">
      {exposure === "custom-domain"
        ? "private"
        : exposure === "funnel"
          ? "public"
          : "tailnet"}
    </span>
  );
}

export function StackLauncherPage() {
  const publicDomain = resolveArrStackPublicDomain();
  const funnelHost = resolveArrStackFunnelHost();
  const tailnetHost = resolveArrStackTailnetHost();
  const funnelConfigured = funnelHost.length > 0;
  const tailnetConfigured = tailnetHost.length > 0;
  const launcherApps = arrStackApps.filter((arrStackApp) =>
    arrStackApp.exposure === "custom-domain"
      ? publicDomain.length > 0
      : arrStackApp.exposure === "funnel"
        ? funnelConfigured
        : tailnetConfigured,
  );

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="font-mono text-[11px] uppercase tracking-[2px] text-text-faint">
          SELF-HOSTED STACK
        </span>
        <h1 className="m-0 font-grotesk text-[clamp(28px,5vw,48px)] font-bold leading-none tracking-[-1px]">
          {stackLauncherRoute.navigationLabel}
        </h1>
        <p className="m-0 max-w-[60ch] font-mono text-[13px] leading-[1.6] text-muted-foreground">
          {stackLauncherRoute.description}
        </p>
      </header>

      {launcherApps.length > 0 ? (
        <section
          aria-label="Self-hosted apps"
          className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(13rem,1fr))]"
        >
          {launcherApps.map((arrStackApp) => (
            <a
              key={arrStackApp.id}
              href={buildArrStackAppUrl(arrStackApp)}
              target="_blank"
              rel="noreferrer"
              className="block rounded-lg border border-border bg-surface px-5 py-4 text-inherit no-underline transition-colors hover:border-primary"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="text-[1.05rem] font-semibold text-primary">
                  {arrStackApp.label}
                </div>
                <ExposureBadge exposure={arrStackApp.exposure} />
              </div>
              <div className="mt-1.5 font-mono text-sm text-muted-foreground">
                {arrStackApp.exposure === "custom-domain"
                  ? `${arrStackApp.subdomainLabel}.${publicDomain}`
                  : arrStackApp.exposure === "funnel"
                    ? `port ${arrStackApp.funnelPort}`
                    : `port ${arrStackApp.port}`}
              </div>
            </a>
          ))}
        </section>
      ) : (
        <section
          aria-label="Stack host not configured"
          className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-status-negative px-6 py-12 text-center"
        >
          <div className="font-mono text-xs uppercase tracking-[2px] text-status-negative">
            stack host not configured
          </div>
          <p className="m-0 max-w-[52ch] font-mono text-[13px] leading-[1.6] text-muted-foreground">
            Set VITE_ARR_STACK_HOST and VITE_ARR_STACK_TAILNET_HOST at build
            time to link the self-hosted apps.
          </p>
        </section>
      )}
    </div>
  );
}
