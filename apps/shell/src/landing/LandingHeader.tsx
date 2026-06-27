import { Button } from "@platform/design-system";
import { OWNER_SIGN_IN_ENTRY_ROUTE } from "@platform/config";
import { useScrolledPastThreshold } from "./useScrolledPastThreshold";
import { openCommandPalette } from "./CommandPalette";

const headerNavigationLinks = [
  { label: "SECTIONS", href: "#sections" },
  { label: "PLATFORM", href: "#platform" },
  { label: "ROADMAP", href: "#roadmap" },
] as const;

export function LandingHeader() {
  const hasScrolled = useScrolledPastThreshold(24);
  return (
    <header
      className={
        "fixed inset-x-0 top-0 z-50 transition-colors " +
        (hasScrolled
          ? "border-b border-border bg-surface-translucent backdrop-blur-[8px]"
          : "border-b border-transparent bg-transparent")
      }
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 md:px-12">
        <a href="#top" className="flex items-center gap-3 no-underline">
          <span className="h-[10px] w-[10px] bg-primary" />
          <span className="font-grotesk text-[13px] font-bold tracking-[2.5px] text-foreground">
            LUCASZANONI
          </span>
        </a>
        <nav aria-label="Primary" className="hidden md:block">
          <ul className="m-0 flex list-none items-center gap-7 p-0">
            {headerNavigationLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="group relative font-mono text-[10px] uppercase tracking-[1.5px] text-text-faint no-underline transition-colors hover:text-foreground"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 h-[1px] w-0 bg-primary transition-[width] duration-200 group-hover:w-full" />
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openCommandPalette}
            aria-label="Open command palette"
            className="hidden items-center gap-2 border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[1.5px] text-text-faint transition-colors hover:text-foreground sm:flex"
          >
            <span>Jump to</span>
            <span className="border border-border px-1.5 py-0.5 text-[10px] normal-case tracking-normal text-muted-foreground">
              &#8984;K
            </span>
          </button>
          <Button asChild variant="brand" size="sm">
            <a href={OWNER_SIGN_IN_ENTRY_ROUTE.mountPath}>ENTER</a>
          </Button>
        </div>
      </div>
    </header>
  );
}
