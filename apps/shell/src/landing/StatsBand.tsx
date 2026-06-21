import { MICRO_FRONTEND_ROUTES } from "@platform/config";
import { buildHomeSectionCards } from "../home-sections";

interface PlatformStat {
  readonly value: string;
  readonly label: string;
}

function buildPlatformStats(): PlatformStat[] {
  return [
    {
      value: String(MICRO_FRONTEND_ROUTES.length).padStart(2, "0"),
      label: "MICRO-FRONTENDS",
    },
    {
      value: String(buildHomeSectionCards().length).padStart(2, "0"),
      label: "PUBLIC SECTIONS",
    },
    { value: "STATIC", label: "BUILD PROFILE" },
    { value: "1", label: "CLOUDFLARE EDGE" },
  ];
}

export function StatsBand() {
  const platformStats = buildPlatformStats();
  return (
    <section className="border-t border-border py-20">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {platformStats.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-2">
            <span className="font-grotesk text-[clamp(36px,5vw,56px)] font-bold leading-none tracking-[-1px] text-primary">
              {stat.value}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[2px] text-text-faint">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
