import { LandingHeader } from "../landing/LandingHeader";
import { LandingFooter } from "../landing/LandingFooter";

export function CatalogPage() {
  return (
    <div id="top" className="bg-background">
      <LandingHeader />
      <main className="mx-auto min-h-[60vh] max-w-[1400px] px-6 pt-40 pb-24 md:px-12">
        <span className="font-mono text-[11px] font-bold uppercase tracking-[2px] text-primary">
          [CATALOG]
        </span>
        <h1 className="mt-5 mb-0 font-grotesk text-[clamp(32px,8vw,72px)] font-bold leading-none tracking-[-1px] text-foreground">
          CATALOG
        </h1>
        <p className="mt-6 max-w-[44rem] font-mono text-[14px] leading-[1.6] tracking-[1px] text-muted-foreground">
          The full catalog of apps and experiments lands here in the redesign.
        </p>
      </main>
      <LandingFooter />
    </div>
  );
}
