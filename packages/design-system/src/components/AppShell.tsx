import type { CSSProperties, ReactNode } from "react";
import { CROSS_SECTION_NAVIGATION_ROUTES } from "@lucaszanoni-web/config";
import type { MicroFrontendId } from "@lucaszanoni-web/config";
import { useTheme } from "../theme/theme-context";
import { buildBreadcrumbTrail } from "../navigation/breadcrumb-trail";

export interface AppShellProps {
  readonly activeRouteId: MicroFrontendId;
  readonly children: ReactNode;
}

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "1.5rem",
  padding: "1rem 1.5rem",
  borderBottom: "1px solid var(--ls-color-border)",
  background: "var(--ls-color-surface-translucent)",
  backdropFilter: "blur(8px)",
  position: "sticky",
  top: 0,
};

const navListStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "1.25rem",
  listStyle: "none",
  margin: 0,
  padding: 0,
};

const navLinkStyle: CSSProperties = {
  color: "var(--ls-color-text-muted)",
  textDecoration: "none",
  fontSize: "0.9rem",
};

const activeNavLinkStyle: CSSProperties = {
  ...navLinkStyle,
  color: "var(--ls-color-accent)",
};

const themeToggleStyle: CSSProperties = {
  background: "transparent",
  border: "1px solid var(--ls-color-border)",
  borderRadius: "6px",
  color: "var(--ls-color-text-primary)",
  cursor: "pointer",
  padding: "0.35rem 0.75rem",
  fontSize: "0.85rem",
};

const breadcrumbNavStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.4rem",
  padding: "0.75rem 1.5rem",
  color: "var(--ls-color-text-muted)",
  fontSize: "0.8rem",
};

const breadcrumbSeparatorStyle: CSSProperties = {
  color: "var(--ls-color-border)",
};

const mainStyle: CSSProperties = {
  padding: "1.5rem",
  maxWidth: "72rem",
  margin: "0 auto",
};

export function AppShell({ activeRouteId, children }: AppShellProps) {
  const { themeName, toggleTheme } = useTheme();
  const breadcrumbTrail = buildBreadcrumbTrail(activeRouteId);
  return (
    <div>
      <header style={headerStyle}>
        <nav aria-label="Primary">
          <ul style={navListStyle}>
            <li>
              <a href="/" style={navLinkStyle}>
                lucaszanoni.com.br
              </a>
            </li>
            {CROSS_SECTION_NAVIGATION_ROUTES.map((route) => (
              <li key={route.id}>
                <a
                  href={route.mountPath}
                  style={
                    route.id === activeRouteId
                      ? activeNavLinkStyle
                      : navLinkStyle
                  }
                  aria-current={route.id === activeRouteId ? "page" : undefined}
                >
                  {route.navigationLabel}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <button type="button" onClick={toggleTheme} style={themeToggleStyle}>
          {themeName === "dark" ? "Light" : "Dark"} mode
        </button>
      </header>
      <nav aria-label="Breadcrumb" style={breadcrumbNavStyle}>
        {breadcrumbTrail.map((step, index) => (
          <span key={step.href}>
            {index > 0 ? (
              <span style={breadcrumbSeparatorStyle}>{" / "}</span>
            ) : null}
            <a href={step.href} style={navLinkStyle}>
              {step.label}
            </a>
          </span>
        ))}
      </nav>
      <main style={mainStyle}>{children}</main>
    </div>
  );
}
