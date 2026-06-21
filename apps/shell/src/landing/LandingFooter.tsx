const trafficLightColors = ["#FF5F57", "#FEBC2E", "#4ADE80"];

const footerLinkColumns = [
  {
    heading: "PLATFORM",
    links: [
      { label: "Sections", href: "#sections" },
      { label: "Built for the terminal", href: "#platform" },
      { label: "Roadmap", href: "#roadmap" },
    ],
  },
  {
    heading: "BUILD",
    links: [
      {
        label: "Source",
        href: "https://github.com/Castrozan/lucaszanoni-web",
      },
    ],
  },
] as const;

export function LandingFooter() {
  return (
    <footer className="border-t border-border py-14">
      <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
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
        <div className="flex gap-16">
          {footerLinkColumns.map((column) => (
            <div key={column.heading} className="flex flex-col gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[2px] text-text-faint">
                {column.heading}
              </span>
              {column.links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="font-mono text-[12px] tracking-[0.5px] text-muted-foreground no-underline transition-colors hover:text-foreground"
                >
                  {link.label}
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
