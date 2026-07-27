import {
  CROSS_SECTION_NAVIGATION_ROUTES,
  OWNER_SIGN_IN_ENTRY_ROUTE,
} from "@platform/config";
import {
  ABOUT_SECTION_ID,
  COCKPIT_SECTION_ID,
  KEYBOARD_SECTION_ID,
  SHOWCASE_SECTION_ID,
} from "./landingSections";

const trafficLightColors = ["#FF5F57", "#FEBC2E", "#4ADE80"];

interface FooterLink {
  readonly label: string;
  readonly href: string;
}

export function buildRouteSitemapLinks(): FooterLink[] {
  return [
    ...CROSS_SECTION_NAVIGATION_ROUTES.map((route) => ({
      label: route.navigationLabel,
      href: route.mountPath,
    })),
    {
      label: OWNER_SIGN_IN_ENTRY_ROUTE.navigationLabel,
      href: OWNER_SIGN_IN_ENTRY_ROUTE.mountPath,
    },
  ];
}

const inPageLinks: readonly FooterLink[] = [
  { label: "Keyboard", href: `/#${KEYBOARD_SECTION_ID}` },
  { label: "Cockpit", href: `/#${COCKPIT_SECTION_ID}` },
  { label: "Showcase", href: `/#${SHOWCASE_SECTION_ID}` },
  { label: "About Atrium", href: `/#${ABOUT_SECTION_ID}` },
];

const sourceLink: FooterLink = {
  label: "Source",
  href: "https://github.com/Castrozan/lucaszanoni-web",
};

function FooterLinkColumn({
  heading,
  links,
}: {
  readonly heading: string;
  readonly links: readonly FooterLink[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <span className="font-mono text-[10px] uppercase tracking-[2px] text-text-faint">
        {heading}
      </span>
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          className="font-mono text-[12px] tracking-[0.5px] text-muted-foreground no-underline transition-colors hover:text-foreground"
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-10 px-6 py-14 md:flex-row md:items-start md:justify-between md:px-12">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="h-[10px] w-[10px] bg-primary" />
            <span className="font-grotesk text-[13px] font-bold tracking-[2.5px] text-foreground">
              LUCASZANONI
            </span>
          </div>
          <div className="flex items-center gap-2">
            {trafficLightColors.map((color) => (
              <span
                key={color}
                className="h-[8px] w-[8px] rounded-full"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <span className="font-mono text-[11px] tracking-[1.5px] text-text-faint">
            ATRIUM // ONE EDGE, MANY APPS
          </span>
        </div>
        <div className="flex flex-wrap gap-16">
          <FooterLinkColumn heading="ROUTES" links={buildRouteSitemapLinks()} />
          <FooterLinkColumn heading="PLATFORM" links={inPageLinks} />
          <FooterLinkColumn heading="BUILD" links={[sourceLink]} />
        </div>
      </div>
    </footer>
  );
}
