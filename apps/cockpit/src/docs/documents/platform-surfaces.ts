import {
  MICRO_FRONTEND_ROUTES,
  belongsToPrivateEnvironment,
} from "@platform/config";
import type { PlatformSurface, SystemDocument } from "../system-document";

function registeredSurfaces(): readonly PlatformSurface[] {
  return MICRO_FRONTEND_ROUTES.map((route) => ({
    id: route.id,
    label: route.navigationLabel,
    mountPath: route.mountPath,
    purpose: route.description,
    isOwnerOnly: belongsToPrivateEnvironment(route.accessModel),
  }));
}

export const platformSurfacesDocument: SystemDocument = {
  id: "platform-surfaces",
  title: "What runs behind the domain",
  summary:
    "One domain, one edge, many small applications mounted under their own paths. Every surface marked owner only sits behind the same Cloudflare Access policy that let you open this page, so the list itself is private.",
  body: {
    kind: "platform-surfaces",
    label: "Platform surfaces",
    surfaces: registeredSurfaces(),
  },
};
