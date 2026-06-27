import { platformFeatures } from "./landingContent";

export function PlatformFeatureTrio() {
  return (
    <section id="platform" className="border-t border-border py-20">
      <h2 className="m-0 mb-10 font-grotesk text-[clamp(28px,6vw,64px)] font-bold tracking-[-0.5px] text-foreground">
        BUILT FOR THE TERMINAL GENERATION
      </h2>
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
    </section>
  );
}
