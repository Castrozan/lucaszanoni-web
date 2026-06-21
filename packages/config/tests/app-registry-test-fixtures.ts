import type { AppRegistryEntry } from "../src/app-registry-types";

export const shellApp: AppRegistryEntry = {
  id: "shell",
  mountPath: "/",
  navigationLabel: "Home",
  description: "Platform overview and entry point.",
  showInCrossSectionNavigation: false,
  status: "active",
  accessModel: { kind: "public" },
  origin: {
    kind: "in-repo-cloud-run",
    cloudRunServiceName: "lucaszanoni-shell",
    appPackageName: "@platform/shell",
    appDirectoryName: "shell",
    buildProfile: "static-spa",
    nonSecretEnvironment: {},
    secretEnvironmentReferences: {},
  },
};

export const usageDashboardApp: AppRegistryEntry = {
  id: "usage-dashboard",
  mountPath: "/engineering/dotfiles/claude/usage/",
  navigationLabel: "Claude usage",
  description: "Live Claude Code token usage and cost across machines.",
  showInCrossSectionNavigation: true,
  status: "active",
  accessModel: { kind: "owner-only" },
  origin: {
    kind: "in-repo-cloud-run",
    cloudRunServiceName: "lucaszanoni-usage-dashboard",
    appPackageName: "@platform/usage-dashboard",
    appDirectoryName: "usage-dashboard",
    buildProfile: "static-spa",
    nonSecretEnvironment: {},
    secretEnvironmentReferences: {},
  },
};

export const reportsApp: AppRegistryEntry = {
  id: "reports",
  mountPath: "/engineering/dotfiles/reports/",
  navigationLabel: "Reports",
  description: "Generated reports hub.",
  showInCrossSectionNavigation: true,
  status: "active",
  accessModel: { kind: "owner-only" },
  origin: {
    kind: "in-repo-cloud-run",
    cloudRunServiceName: "lucaszanoni-reports",
    appPackageName: "@platform/reports",
    appDirectoryName: "reports",
    buildProfile: "static-spa",
    nonSecretEnvironment: {},
    secretEnvironmentReferences: {},
  },
};

export const dbApp: AppRegistryEntry = {
  id: "db",
  mountPath: "/db/",
  navigationLabel: "Database",
  description:
    "Owner-only application attached at the edge and gated by Cloudflare Access.",
  showInCrossSectionNavigation: false,
  status: "active",
  accessModel: { kind: "owner-only" },
  origin: {
    kind: "external-https",
    originHost: "example.com",
    pathRewrite: "preserve",
    forwardedBasePath: "",
    trusted: false,
  },
};

export const todaysApps: readonly AppRegistryEntry[] = [
  shellApp,
  usageDashboardApp,
  reportsApp,
  dbApp,
];
