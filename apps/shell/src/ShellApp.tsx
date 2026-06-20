import { AppShell, ThemeProvider } from "@lucaszanoni-web/design-system";
import { buildHomeSectionCards } from "./home-sections";

export function ShellApp() {
  const sectionCards = buildHomeSectionCards();
  return (
    <ThemeProvider>
      <AppShell activeRouteId="shell">
        <section className="mb-10 flex flex-col gap-3">
          <h1 className="m-0 text-3xl text-foreground">Lucas Zanoni</h1>
          <p className="m-0 max-w-[42rem] leading-relaxed text-muted-foreground">
            Engineering notes and live operational dashboards, served as
            independently deployed micro-frontends behind a single edge.
          </p>
        </section>
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(18rem,1fr))]">
          {sectionCards.map((card) => (
            <a
              key={card.id}
              href={card.href}
              className="block rounded-lg border border-border bg-surface-translucent p-5 no-underline"
            >
              <h2 className="mt-0 mb-1.5 text-lg text-primary">{card.title}</h2>
              <p className="m-0 text-sm leading-normal text-muted-foreground">
                {card.description}
              </p>
            </a>
          ))}
        </div>
      </AppShell>
    </ThemeProvider>
  );
}
