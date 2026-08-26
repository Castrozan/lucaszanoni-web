import { findMicroFrontendRoute } from "@platform/config";
import type { StatusBarModel } from "@platform/design-system";
import { arrStackApps } from "./arr-stack-apps";
import {
  arrStackAppLinkExposureLabel,
  buildArrStackAppLinks,
} from "./arr-stack-host";

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
        buildArrStackAppLinks(app).map((link) => ({
          kind: "link" as const,
          id: `${app.id}-${link.exposure}`,
          label: `${app.label} ${arrStackAppLinkExposureLabel(link.exposure)}`,
          href: link.url,
          isActive: false,
        })),
      ),
    ],
  };
}
