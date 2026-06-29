import type { AppRegistryEntry } from "../src/app-registry-types";

export const jarvisSessionApp: AppRegistryEntry = {
  id: "jarvis-session",
  mountPath: "/cockpit/jarvis-session/",
  navigationLabel: "Jarvis session",
  description:
    "Owner-only websocket bridge to the Jarvis session host, attached at the edge and gated by Cloudflare Access.",
  showInCrossSectionNavigation: false,
  status: "active",
  accessModel: { environment: "private", audience: { kind: "owner" } },
  accessApplicationProvisioning: {
    kind: "inherited-from-parent-path",
    parentMountPath: "/cockpit/",
  },
  origin: {
    kind: "external-https",
    originHost: "jarvis-session-origin.lucaszanoni.com",
    pathRewrite: "preserve",
    forwardedBasePath: "",
    trusted: false,
  },
};

export const kiraSessionApp: AppRegistryEntry = {
  id: "kira-session",
  mountPath: "/cockpit/kira-session/",
  navigationLabel: "Kira session",
  description:
    "Owner-only websocket bridge to the kira session host, attached at the edge and gated by Cloudflare Access.",
  showInCrossSectionNavigation: false,
  status: "active",
  accessModel: { environment: "private", audience: { kind: "owner" } },
  accessApplicationProvisioning: {
    kind: "inherited-from-parent-path",
    parentMountPath: "/cockpit/",
  },
  origin: {
    kind: "external-https",
    originHost: "kira-session-origin.lucaszanoni.com",
    pathRewrite: "preserve",
    forwardedBasePath: "",
    trusted: false,
  },
};

export const rinSessionApp: AppRegistryEntry = {
  id: "rin-session",
  mountPath: "/cockpit/rin-session/",
  navigationLabel: "Rin session",
  description:
    "Owner-only websocket bridge to the rin session host, attached at the edge and gated by Cloudflare Access.",
  showInCrossSectionNavigation: false,
  status: "active",
  accessModel: { environment: "private", audience: { kind: "owner" } },
  accessApplicationProvisioning: {
    kind: "inherited-from-parent-path",
    parentMountPath: "/cockpit/",
  },
  origin: {
    kind: "external-https",
    originHost: "rin-session-origin.lucaszanoni.com",
    pathRewrite: "preserve",
    forwardedBasePath: "",
    trusted: false,
  },
};
