import { MICRO_FRONTEND_ROUTES } from "@platform/config";
import type { MicroFrontendRoute } from "@platform/config";

interface PlatformStat {
  readonly value: string;
  readonly label: string;
}

function countRoutes(
  predicate: (route: MicroFrontendRoute) => boolean,
): number {
  return MICRO_FRONTEND_ROUTES.filter(predicate).length;
}

export function buildPlatformStats(): PlatformStat[] {
  const totalRoutes = MICRO_FRONTEND_ROUTES.length;
  const publicRoutes = countRoutes(
    (route) => route.accessModel.environment === "public",
  );
  const ownerGatedRoutes = countRoutes(
    (route) => route.accessModel.environment === "private",
  );
  const aiPoweredRoutes = countRoutes((route) => route.isAiPowered);
  return [
    { value: String(totalRoutes).padStart(2, "0"), label: "MICRO-FRONTENDS" },
    { value: String(publicRoutes).padStart(2, "0"), label: "PUBLIC" },
    { value: String(ownerGatedRoutes).padStart(2, "0"), label: "OWNER-GATED" },
    { value: String(aiPoweredRoutes).padStart(2, "0"), label: "AI-POWERED" },
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
