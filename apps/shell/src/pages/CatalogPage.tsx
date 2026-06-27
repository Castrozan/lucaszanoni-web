import { buildCatalogCards } from "../home-sections";
import { LandingHeader } from "../landing/LandingHeader";
import { LandingFooter } from "../landing/LandingFooter";
import { RegistryTile } from "../landing/RegistryTile";
import { useOwnerIdentity } from "../landing/ownerIdentity";

export function CatalogPage() {
  const catalogCards = buildCatalogCards();
  const isOwnerAuthenticated = useOwnerIdentity() === "authenticated";
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
          Every app and experiment on the platform, rendered live from the
          registry. Public apps open directly; owner-gated ones unlock behind
          Cloudflare Access.
        </p>
        <div className="mt-12 grid gap-px bg-border [grid-template-columns:repeat(auto-fill,minmax(18rem,1fr))]">
          {catalogCards.map((card, index) => (
            <RegistryTile
              key={card.id}
              card={card}
              index={index}
              isOwnerAuthenticated={isOwnerAuthenticated}
            />
          ))}
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
