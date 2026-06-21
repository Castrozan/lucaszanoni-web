import { buildHomeSectionCards } from "../home-sections";

function formatSectionIndex(zeroBasedIndex: number): string {
  return String(zeroBasedIndex + 1).padStart(2, "0");
}

export function SectionsGrid() {
  const sectionCards = buildHomeSectionCards();
  return (
    <section id="sections" className="border-t border-border py-20">
      <div className="mb-10 flex items-end justify-between">
        <h2 className="m-0 font-grotesk text-[clamp(28px,6vw,64px)] font-bold tracking-[-0.5px] text-foreground">
          SECTIONS
        </h2>
        <span className="font-mono text-[11px] uppercase tracking-[2px] text-text-faint">
          LIVE ROUTES
        </span>
      </div>
      <div className="grid gap-px bg-border [grid-template-columns:repeat(auto-fill,minmax(18rem,1fr))]">
        {sectionCards.map((card, index) => (
          <a
            key={card.id}
            href={card.href}
            className="group block bg-surface p-6 no-underline transition-colors hover:bg-surface-raised"
          >
            <span className="font-mono text-[11px] tracking-[2px] text-text-faint">
              {formatSectionIndex(index)}
            </span>
            <h3 className="mt-3 mb-2 font-grotesk text-[20px] font-bold tracking-[-0.3px] text-primary">
              {card.title}
            </h3>
            <p className="m-0 font-mono text-[13px] leading-[1.6] tracking-[0.5px] text-muted-foreground">
              {card.description}
            </p>
          </a>
        ))}
      </div>
    </section>
  );
}
