import { MICRO_FRONTEND_ROUTES } from "@platform/config";
import type { MicroFrontendRoute } from "@platform/config";

export interface PlatformStat {
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
