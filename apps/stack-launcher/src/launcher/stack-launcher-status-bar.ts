import { findMicroFrontendRoute } from "@platform/config";
import type { StatusBarModel } from "@platform/design-system";
import { arrStackApps } from "./arr-stack-apps";
import { buildArrStackAppLinks } from "./arr-stack-host";

const stackLauncherRoute = findMicroFrontendRoute("stack-launcher");

export function buildStackLauncherStatusBarModel(): StatusBarModel {
  return {
    sessionLabel: stackLauncherRoute.navigationLabel,
    windows: [
      {
        kind: "link",
        id: stackLauncherRoute.id,
        label: stackLauncherRoute.navigationLabel,
        href: stackLauncherRoute.mountPath,
        isActive: true,
      },
      ...arrStackApps.flatMap((app) =>
        buildArrStackAppLinks(app)
          .filter((link) => link.exposure === "cloudflare")
          .map((link) => ({
            kind: "link" as const,
            id: `${app.id}-${link.exposure}`,
            label: app.label,
            href: link.url,
            isActive: false,
          })),
      ),
    ],
  };
}
