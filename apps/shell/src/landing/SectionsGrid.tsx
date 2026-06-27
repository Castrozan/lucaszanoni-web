import { buildHomeSectionCards, type HomeSectionCard } from "../home-sections";
import { useOwnerIdentity } from "./ownerIdentity";

function formatSectionIndex(zeroBasedIndex: number): string {
  return String(zeroBasedIndex + 1).padStart(2, "0");
}

function buildTileBadges(card: HomeSectionCard): string[] {
  const badges: string[] = [];
  if (card.buildProfile === "dynamic-service") {
    badges.push("Dynamic");
  } else if (card.buildProfile === "static-spa") {
    badges.push("Static");
  } else {
    badges.push("Edge");
  }
  if (card.isAiPowered) {
    badges.push("AI");
  }
  badges.push(card.locked ? "Owner" : "Public");
  return badges;
}

function TileBadge({ label }: { label: string }) {
  return (
    <span className="border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[1.5px] text-text-faint">
      {label}
    </span>
  );
}

export function SectionsGrid() {
  const sectionCards = buildHomeSectionCards();
  const ownerIdentityStatus = useOwnerIdentity();
  const isOwnerAuthenticated = ownerIdentityStatus === "authenticated";
  return (
    <section id="sections" className="border-t border-border py-20">
      <div className="mb-10 flex items-end justify-between">
        <h2 className="m-0 font-grotesk text-[clamp(28px,6vw,64px)] font-bold tracking-[-0.5px] text-foreground">
          SECTIONS
        </h2>
        <span className="font-mono text-[11px] uppercase tracking-[2px] text-text-faint">
          ROUTES
        </span>
      </div>
      <div className="grid gap-px bg-border [grid-template-columns:repeat(auto-fill,minmax(18rem,1fr))]">
        {sectionCards.map((card, index) => {
          const effectivelyLocked = card.locked && !isOwnerAuthenticated;
          return (
            <a
              key={card.id}
              href={card.href}
              data-locked={effectivelyLocked ? "true" : "false"}
              aria-label={
                effectivelyLocked
                  ? `${card.title} (owner-gated, sign in to access)`
                  : card.title
              }
              className="group block bg-surface p-6 no-underline transition-colors hover:bg-surface-raised"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] tracking-[2px] text-text-faint">
                  {formatSectionIndex(index)}
                </span>
                {effectivelyLocked && (
                  <span className="font-mono text-[10px] uppercase tracking-[1.5px] text-text-faint">
                    Sign in &rarr;
                  </span>
                )}
                {card.locked && isOwnerAuthenticated && (
                  <span className="font-mono text-[10px] uppercase tracking-[1.5px] text-primary">
                    Unlocked
                  </span>
                )}
              </div>
              <h3 className="mt-3 mb-2 font-grotesk text-[20px] font-bold tracking-[-0.3px] text-primary">
                {card.title}
              </h3>
              <p className="m-0 font-mono text-[13px] leading-[1.6] tracking-[0.5px] text-muted-foreground">
                {card.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {buildTileBadges(card).map((badge) => (
                  <TileBadge key={badge} label={badge} />
                ))}
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
