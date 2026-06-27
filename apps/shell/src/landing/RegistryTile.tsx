import type { HomeSectionCard } from "../home-sections";

function formatTileIndex(zeroBasedIndex: number): string {
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

export function RegistryTile({
  card,
  index,
  isOwnerAuthenticated,
}: {
  readonly card: HomeSectionCard;
  readonly index: number;
  readonly isOwnerAuthenticated: boolean;
}) {
  const effectivelyLocked = card.locked && !isOwnerAuthenticated;
  return (
    <a
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
          {formatTileIndex(index)}
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
}
