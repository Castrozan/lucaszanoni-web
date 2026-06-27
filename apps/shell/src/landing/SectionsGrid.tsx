import { buildHomeSectionCards } from "../home-sections";
import { useOwnerIdentity } from "./ownerIdentity";
import { RegistryTile } from "./RegistryTile";

export function SectionsGrid() {
  const sectionCards = buildHomeSectionCards();
  const isOwnerAuthenticated = useOwnerIdentity() === "authenticated";
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
        {sectionCards.map((card, index) => (
          <RegistryTile
            key={card.id}
            card={card}
            index={index}
            isOwnerAuthenticated={isOwnerAuthenticated}
          />
        ))}
      </div>
    </section>
  );
}
