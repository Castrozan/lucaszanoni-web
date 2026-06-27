import { Button } from "@platform/design-system";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import { useCharacterDecode } from "./useCharacterDecode";
import { BlockCursor } from "./BlockCursor";
import { HeroTerminalPanel } from "./HeroTerminalPanel";
import { heroContent } from "./landingContent";

export function HeroSection() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const decodedHeadline = useCharacterDecode(
    heroContent.dynamicHeadlineLine,
    prefersReducedMotion,
  );
  return (
    <section className="grid items-center gap-12 pt-40 pb-24 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="flex flex-col gap-7">
        <span className="flex w-fit items-center gap-2.5 border-2 border-primary bg-surface-raised px-3 py-1.5">
          <span className="h-[8px] w-[8px] bg-primary" />
          <span className="font-mono text-[11px] font-bold uppercase tracking-[2px] text-primary">
            {heroContent.kicker}
          </span>
        </span>
        <h1 className="m-0 font-grotesk text-[clamp(32px,10vw,96px)] font-bold leading-none tracking-[-1px]">
          <span className="block text-foreground">
            {heroContent.staticHeadlineLine}
          </span>
          <span className="relative block text-primary">
            <span aria-hidden="true" className="invisible whitespace-nowrap">
              {heroContent.dynamicHeadlineLine}
            </span>
            <span
              className="absolute inset-0 whitespace-nowrap"
              aria-live="polite"
            >
              {decodedHeadline}
              <BlockCursor />
            </span>
          </span>
        </h1>
        <p className="m-0 max-w-[44rem] font-mono text-[14px] leading-[1.6] tracking-[1px] text-muted-foreground">
          {heroContent.subhead}
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <Button asChild variant="brand" size="lg">
            <a href={heroContent.primaryCallToAction.href}>
              {heroContent.primaryCallToAction.label}
            </a>
          </Button>
          <Button asChild variant="terminal" size="lg">
            <a
              href={heroContent.secondaryCallToAction.href}
              target="_blank"
              rel="noreferrer"
            >
              {heroContent.secondaryCallToAction.label}
            </a>
          </Button>
        </div>
      </div>
      <HeroTerminalPanel />
    </section>
  );
}
