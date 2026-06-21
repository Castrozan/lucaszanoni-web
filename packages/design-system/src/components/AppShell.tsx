import type { ReactNode } from "react";
import { CROSS_SECTION_NAVIGATION_ROUTES } from "@platform/config";
import type { MicroFrontendId } from "@platform/config";
import { useTheme } from "../theme/theme-context";
import { buildBreadcrumbTrail } from "../navigation/breadcrumb-trail";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";

export interface AppShellProps {
  readonly activeRouteId: MicroFrontendId;
  readonly children: ReactNode;
}

const navigationLinkBaseClassName = "text-sm no-underline transition-colors";

function navigationLinkClassName(isActive: boolean) {
  return cn(
    navigationLinkBaseClassName,
    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
  );
}

export function AppShell({ activeRouteId, children }: AppShellProps) {
  const { themeName, toggleTheme } = useTheme();
  const breadcrumbTrail = buildBreadcrumbTrail(activeRouteId);
  return (
    <div>
      <header className="sticky top-0 flex items-center justify-between gap-6 border-b border-border bg-surface-translucent px-6 py-4 backdrop-blur-[8px]">
        <nav aria-label="Primary">
          <ul className="m-0 flex list-none items-center gap-5 p-0">
            <li>
              <a href="/" className={navigationLinkClassName(false)}>
                lucaszanoni.com
              </a>
            </li>
            {CROSS_SECTION_NAVIGATION_ROUTES.map((route) => (
              <li key={route.id}>
                <a
                  href={route.mountPath}
                  className={navigationLinkClassName(
                    route.id === activeRouteId,
                  )}
                  aria-current={route.id === activeRouteId ? "page" : undefined}
                >
                  {route.navigationLabel}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <Button variant="outline" size="sm" onClick={toggleTheme}>
          {themeName === "dark" ? "Light" : "Dark"} mode
        </Button>
      </header>
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 px-6 py-3 text-xs text-muted-foreground"
      >
        {breadcrumbTrail.map((step, index) => (
          <span key={step.href}>
            {index > 0 ? <span className="text-border">{" / "}</span> : null}
            <a href={step.href} className={navigationLinkClassName(false)}>
              {step.label}
            </a>
          </span>
        ))}
      </nav>
      <main className="mx-auto max-w-[72rem] p-6">{children}</main>
    </div>
  );
}
