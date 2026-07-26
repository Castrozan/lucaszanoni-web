import { Link } from "react-router-dom";
import { heroContent, platformFeatures } from "./landingContent";
import { ABOUT_SECTION_ID } from "./landingSections";
import { getBuildProvenance, formatBuildDate } from "./buildProvenance";

export function AboutAtriumSection() {
  const buildProvenance = getBuildProvenance();
  const buildDate = formatBuildDate(buildProvenance.timestamp);
  return (
    <section id={ABOUT_SECTION_ID} className="border-t border-border py-20">
      <div className="mb-8 flex items-end justify-between gap-6">
        <h2 className="m-0 font-grotesk text-[clamp(28px,6vw,64px)] font-bold tracking-[-0.5px] text-foreground">
          ABOUT ATRIUM
        </h2>
        <span className="shrink-0 font-mono text-[11px] uppercase tracking-[2px] text-text-faint">
          PLATFORM
        </span>
      </div>
      <p className="mb-12 max-w-[52rem] font-mono text-[13px] leading-[1.6] tracking-[0.5px] text-muted-foreground">
        One Cloudflare edge fronts many independently deployed micro-frontends,
        all defined by a single registry that drives routing, infrastructure,
        the deploy matrix, and this page.
      </p>
      <div className="grid gap-6 md:grid-cols-3">
        {platformFeatures.map((feature) => (
          <div
            key={feature.label}
            className="flex flex-col gap-4 border border-border bg-surface p-7"
          >
            <span
              className={
                "flex h-10 w-10 items-center justify-center bg-surface-raised " +
                (feature.accented ? "text-accent-secondary" : "text-primary")
              }
            >
              <span className="h-[14px] w-[14px] bg-current" />
            </span>
            <h3
              className={
                "m-0 font-grotesk text-[22px] font-bold tracking-[-0.3px] " +
                (feature.accented ? "text-accent-secondary" : "text-primary")
              }
            >
              {feature.label}
            </h3>
            <p className="m-0 font-mono text-[13px] leading-[1.6] tracking-[0.5px] text-muted-foreground">
              {feature.body}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-12 font-mono text-[11px] uppercase tracking-[2px] text-muted-foreground">
        {heroContent.deploymentTagline}
        {buildProvenance.isAvailable
          ? ` · DEPLOYED ${buildProvenance.shortSha}${
              buildDate ? ` · ${buildDate}` : ""
            }`
          : ""}
      </p>
      <div className="mt-10 flex justify-center">
        <Link
          to="/about"
          className="border border-border px-5 py-2.5 font-mono text-[12px] uppercase tracking-[1.5px] text-foreground no-underline transition-colors hover:border-primary hover:text-primary"
        >
          More about the ATRIUM &rarr;
        </Link>
      </div>
    </section>
  );
}
