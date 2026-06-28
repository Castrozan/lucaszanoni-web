import { useEffect, useState } from "react";
import { buildPlatformSessions, findActiveLocation } from "@platform/config";
import { loadLeaderBinding } from "../keybinds/keybindStore";
import { formatBindingForDisplay } from "../keybinds/keybindDisplay";
import {
  STATUS_BAR_HEIGHT,
  STATUS_BAR_HEIGHT_CSS_VARIABLE,
} from "./statusBarLayout";
import { StatusBarKeybinds } from "./StatusBarKeybinds";

function readPathname(): string {
  return typeof window === "undefined" ? "/" : window.location.pathname;
}

export function BottomStatusBar() {
  const [pathname, setPathname] = useState(readPathname);

  useEffect(() => {
    document.documentElement.style.setProperty(
      STATUS_BAR_HEIGHT_CSS_VARIABLE,
      STATUS_BAR_HEIGHT,
    );
    function syncPathname() {
      setPathname(window.location.pathname);
    }
    window.addEventListener("popstate", syncPathname);
    return () => {
      window.removeEventListener("popstate", syncPathname);
      document.documentElement.style.removeProperty(
        STATUS_BAR_HEIGHT_CSS_VARIABLE,
      );
    };
  }, []);

  const sessions = buildPlatformSessions();
  const active = findActiveLocation(sessions, pathname);
  const leaderDisplay = formatBindingForDisplay(
    "Leader",
    loadLeaderBinding(window.localStorage),
  );

  return (
    <>
      <StatusBarKeybinds
        windowCount={active ? active.session.windows.length : 0}
      />
      <footer
        aria-label="Status bar"
        className="fixed inset-x-0 bottom-0 z-[60] flex items-center justify-between gap-4 border-t border-border bg-surface px-3 font-mono text-[12px] text-muted-foreground"
        style={{ height: STATUS_BAR_HEIGHT }}
      >
        <span className="shrink-0 bg-accent px-2 py-0.5 font-bold text-background">
          {active ? active.session.label : "Home"}
        </span>
        <nav
          aria-label="Windows"
          className="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto [scrollbar-width:none]"
        >
          {active?.session.windows.map((platformWindow, index) => (
            <a
              key={platformWindow.id}
              href={platformWindow.path}
              aria-current={index === active.windowIndex ? "page" : undefined}
              className={
                index === active.windowIndex
                  ? "shrink-0 text-foreground"
                  : "shrink-0 text-muted-foreground transition-colors hover:text-foreground"
              }
            >
              {index + 1}:{platformWindow.label}
            </a>
          ))}
        </nav>
        <span className="shrink-0 uppercase tracking-[1.5px] text-text-faint">
          {leaderDisplay} · ? help
        </span>
      </footer>
    </>
  );
}
