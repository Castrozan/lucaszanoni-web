import type { ReactNode } from "react";
import { Button, useTheme } from "@platform/design-system";
import { cockpitQuickAccessBookmarks } from "./cockpit-quick-access-bookmarks";

export interface CockpitShellProps {
  readonly children: ReactNode;
}

export function CockpitShell({ children }: CockpitShellProps) {
  const { themeName, toggleTheme } = useTheme();
  return (
    <div className="flex min-h-screen">
      <nav
        aria-label="Quick access"
        className="flex w-60 shrink-0 flex-col gap-1 border-r border-border bg-surface px-4 py-6"
      >
        <span className="mb-5 px-3 font-mono text-[11px] font-bold uppercase tracking-[2px] text-primary">
          [COCKPIT]
        </span>
        {cockpitQuickAccessBookmarks.map((bookmark) => (
          <a
            key={bookmark.id}
            href={bookmark.href}
            {...(bookmark.opensInNewTab
              ? { target: "_blank", rel: "noreferrer" }
              : {})}
            className="rounded-md px-3 py-2 text-sm text-muted-foreground no-underline transition-colors hover:bg-surface-raised hover:text-primary"
          >
            {bookmark.label}
          </a>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="mt-auto"
          onClick={toggleTheme}
        >
          {themeName === "dark" ? "Light" : "Dark"} mode
        </Button>
      </nav>
      <main className="flex-1 px-8 py-8">{children}</main>
    </div>
  );
}
