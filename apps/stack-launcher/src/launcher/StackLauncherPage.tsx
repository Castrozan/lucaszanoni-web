import { findMicroFrontendRoute } from "@platform/config";
import { arrStackApps } from "./arr-stack-apps";
import { buildArrStackAppUrl, resolveArrStackHost } from "./arr-stack-host";

const stackLauncherRoute = findMicroFrontendRoute("stack-launcher");

export function StackLauncherPage() {
  const arrStackHost = resolveArrStackHost();
  const isStackHostConfigured = arrStackHost.length > 0;
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

      {isStackHostConfigured ? (
        <section
          aria-label="Self-hosted apps"
          className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(13rem,1fr))]"
        >
          {arrStackApps.map((arrStackApp) => (
            <a
              key={arrStackApp.id}
              href={buildArrStackAppUrl(arrStackHost, arrStackApp.port)}
              target="_blank"
              rel="noreferrer"
              className="block rounded-lg border border-border bg-surface px-5 py-4 text-inherit no-underline transition-colors hover:border-primary"
            >
              <div className="text-[1.05rem] font-semibold text-primary">
                {arrStackApp.label}
              </div>
              <div className="mt-1.5 font-mono text-sm text-muted-foreground">
                {`port ${arrStackApp.port}`}
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
            Set VITE_ARR_STACK_HOST at build time to link the self-hosted apps.
          </p>
        </section>
      )}
    </div>
  );
}
