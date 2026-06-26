import { useMemo, useRef, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button, useTheme } from "@platform/design-system";
import { cockpitViews } from "../navigation/cockpit-views";
import { useLeaderKeyNavigation } from "../navigation/use-leader-key-navigation";
import { isCommandPaletteEnabled } from "../feature-flags/cockpit-feature-flags";
import {
  buildNavigationCommands,
  buildSessionCommands,
} from "../command-palette/cockpit-commands";
import { useCommandPalette } from "../command-palette/use-command-palette";
import { CommandPalette } from "../command-palette/CommandPalette";
import { useCockpitSessionsContext } from "../sessions/cockpit-sessions-context";
import { cockpitQuickAccessBookmarks } from "./cockpit-quick-access-bookmarks";

export interface CockpitShellProps {
  readonly children: ReactNode;
}

export function CockpitShell({ children }: CockpitShellProps) {
  const { themeName, toggleTheme } = useTheme();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const quickAccessBookmarksRef = useRef<HTMLDivElement>(null);
  const { sessions, selectSession } = useCockpitSessionsContext();
  const commandPaletteEnabled = isCommandPaletteEnabled();
  const paletteCommands = useMemo(
    () => [
      ...buildNavigationCommands(navigate),
      ...buildSessionCommands(sessions, selectSession),
    ],
    [navigate, sessions, selectSession],
  );
  const commandPalette = useCommandPalette(paletteCommands);
  useLeaderKeyNavigation({
    onCommand: (command) => {
      switch (command.kind) {
        case "navigate-view":
          navigate(command.path);
          return;
        case "open-command-palette":
          if (commandPaletteEnabled) {
            commandPalette.openPalette();
          }
          return;
        case "focus-quick-access":
          quickAccessBookmarksRef.current?.querySelector("a")?.focus();
          return;
      }
    },
  });
  return (
    <div className="flex min-h-screen">
      <nav
        aria-label="Cockpit navigation"
        className="flex w-60 shrink-0 flex-col gap-1 border-r border-border bg-surface px-4 py-6"
      >
        <span className="mb-5 px-3 font-mono text-[11px] font-bold uppercase tracking-[2px] text-primary">
          [COCKPIT]
        </span>
        {cockpitViews.map((view) => (
          <Link
            key={view.id}
            to={view.path}
            aria-current={pathname === view.path ? "page" : undefined}
            className="rounded-md px-3 py-2 text-sm text-muted-foreground no-underline transition-colors hover:bg-surface-raised hover:text-primary aria-[current=page]:bg-surface-raised aria-[current=page]:text-primary"
          >
            {view.label}
          </Link>
        ))}
        <span className="mb-1 mt-6 px-3 font-mono text-[10px] uppercase tracking-[2px] text-text-faint">
          Quick access
        </span>
        <div ref={quickAccessBookmarksRef} className="flex flex-col gap-1">
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
        </div>
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
      {commandPaletteEnabled ? (
        <CommandPalette controller={commandPalette} />
      ) : null}
    </div>
  );
}
