import type { UsageHeadlineFigure } from "@platform/usage-insights";

export interface UsageKeyFiguresProps {
  readonly figures: readonly UsageHeadlineFigure[] | null;
  readonly isUnavailable: boolean;
}

const PLACEHOLDER_FIGURE_LABELS = [
  "Latest day",
  "Total tokens",
  "Cache reads",
  "Machines",
];

export function UsageKeyFigures({
  figures,
  isUnavailable,
}: UsageKeyFiguresProps) {
  return (
    <section
      aria-label="Key figures"
      className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(11rem,1fr))]"
    >
      {figures
        ? figures.map((figure) => (
            <div
              key={figure.id}
              className="flex flex-col gap-1 rounded-md border border-border p-4"
            >
              <span className="font-mono text-[11px] uppercase tracking-[2px] text-text-faint">
                {figure.label}
              </span>
              <span className="font-grotesk text-[clamp(22px,3vw,34px)] font-bold leading-none tracking-[-1px]">
                {figure.formattedValue}
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {figure.caption}
              </span>
            </div>
          ))
        : PLACEHOLDER_FIGURE_LABELS.map((label) => (
            <div
              key={label}
              className="flex flex-col gap-1 rounded-md border border-dashed border-border p-4"
            >
              <span className="font-mono text-[11px] uppercase tracking-[2px] text-text-faint">
                {label}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[2px] text-text-faint">
                {isUnavailable ? "unavailable" : "loading"}
              </span>
            </div>
          ))}
    </section>
  );
}
