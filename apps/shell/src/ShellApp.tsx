import type { CSSProperties } from "react";
import { AppShell, ThemeProvider } from "@lucaszanoni-web/design-system";
import { buildHomeSectionCards } from "./home-sections";

const heroStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem",
  marginBottom: "2.5rem",
};

const heroTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "2rem",
  color: "var(--ls-color-text-primary)",
};

const heroSubtitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--ls-color-text-muted)",
  maxWidth: "42rem",
  lineHeight: 1.6,
};

const cardGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(18rem, 1fr))",
  gap: "1rem",
};

const cardStyle: CSSProperties = {
  display: "block",
  padding: "1.25rem",
  borderRadius: "10px",
  border: "1px solid var(--ls-color-border)",
  background: "var(--ls-color-surface-translucent)",
  textDecoration: "none",
};

const cardTitleStyle: CSSProperties = {
  margin: "0 0 0.4rem",
  fontSize: "1.1rem",
  color: "var(--ls-color-accent)",
};

const cardDescriptionStyle: CSSProperties = {
  margin: 0,
  color: "var(--ls-color-text-muted)",
  fontSize: "0.9rem",
  lineHeight: 1.5,
};

export function ShellApp() {
  const sectionCards = buildHomeSectionCards();
  return (
    <ThemeProvider>
      <AppShell activeRouteId="shell">
        <section style={heroStyle}>
          <h1 style={heroTitleStyle}>Lucas Zanoni</h1>
          <p style={heroSubtitleStyle}>
            Engineering notes and live operational dashboards, served as
            independently deployed micro-frontends behind a single edge.
          </p>
        </section>
        <div style={cardGridStyle}>
          {sectionCards.map((card) => (
            <a key={card.id} href={card.href} style={cardStyle}>
              <h2 style={cardTitleStyle}>{card.title}</h2>
              <p style={cardDescriptionStyle}>{card.description}</p>
            </a>
          ))}
        </div>
      </AppShell>
    </ThemeProvider>
  );
}
