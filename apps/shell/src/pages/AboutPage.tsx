import { LandingHeader } from "../landing/LandingHeader";
import { LandingFooter } from "../landing/LandingFooter";
import { EngineeringSection } from "../landing/EngineeringSection";

export function AboutPage() {
  return (
    <div id="top" className="bg-background">
      <LandingHeader />
      <main className="mx-auto max-w-[1400px] px-6 pt-40 pb-24 md:px-12">
        <span className="font-mono text-[11px] font-bold uppercase tracking-[2px] text-primary">
          [ATRIUM]
        </span>
        <h1 className="mt-5 mb-0 font-grotesk text-[clamp(32px,8vw,72px)] font-bold leading-none tracking-[-1px] text-foreground">
          ABOUT ATRIUM
        </h1>
        <p className="mt-6 max-w-[52rem] font-mono text-[14px] leading-[1.7] tracking-[0.5px] text-muted-foreground">
          Atrium is the platform behind lucaszanoni.com: one Cloudflare edge
          that fronts many independently deployed micro-frontends. A single
          registry defines every app, and from it the platform derives routing,
          infrastructure, the deploy matrix, access policy, and the pages you
          are reading. The result is a site you can grow one app at a time
          without redeploying the rest.
        </p>
        <EngineeringSection />
      </main>
      <LandingFooter />
    </div>
  );
}
