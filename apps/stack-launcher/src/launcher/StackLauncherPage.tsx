import { findMicroFrontendRoute } from "@platform/config";
import { arrStackApps } from "./arr-stack-apps";
import {
  arrStackAppLinkExposureLabel,
  buildArrStackAppLinks,
  type ArrStackAppLink,
} from "./arr-stack-host";

const stackLauncherRoute = findMicroFrontendRoute("stack-launcher");

function AppLaunchLink({
  appLabel,
  link,
}: {
  appLabel: string;
  link: ArrStackAppLink;
}) {
  const label = arrStackAppLinkExposureLabel(link.exposure);
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noreferrer"
      aria-label={`${appLabel} via ${label}`}
      className="rounded border border-border px-3 py-2 font-mono text-xs uppercase tracking-[1px] text-muted-foreground no-underline transition-colors hover:border-primary hover:text-primary"
    >
      {label}
    </a>
  );
}

export function StackLauncherPage() {
  const launcherApps = arrStackApps
    .map((arrStackApp) => ({
      app: arrStackApp,
      links: buildArrStackAppLinks(arrStackApp),
    }))
    .filter(({ links }) => links.length > 0);

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
          {launcherApps.map(({ app, links }) => (
            <article
              key={app.id}
              className="rounded-lg border border-border bg-surface px-5 py-4"
            >
              <div className="text-[1.05rem] font-semibold text-primary">
                {app.label}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {links.map((link) => (
                  <AppLaunchLink
                    key={link.exposure}
                    appLabel={app.label}
                    link={link}
                  />
                ))}
              </div>
            </article>
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
            Configure a public domain or VITE_ARR_STACK_TAILNET_HOST at build
            time to expose launch links.
          </p>
        </section>
      )}
    </div>
  );
}
