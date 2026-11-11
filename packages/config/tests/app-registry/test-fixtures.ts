import type { AppRegistryEntry } from "../../src/app-registry/types";
import {
  dynamicIaCanvasApp,
  dynamicIaInterfacesApp,
  ingestApp,
} from "./dynamic-service-fixtures";
import {
  terminalSessionApp,
  kiraSessionApp,
  rinSessionApp,
} from "./session-fixtures";

export const shellApp: AppRegistryEntry = {
  id: "shell",
  mountPath: "/",
  navigationLabel: "Home",
  description: "Platform overview and entry point.",
  showInCrossSectionNavigation: false,
  status: "active",
  accessModel: { environment: "public" },
  source: {
    appPackageName: "@platform/shell",
    appDirectoryName: "shell",
    buildProfile: "static-spa",
    publicBuildEnvironment: {},
    publicBuildEnvironmentReferences: {},
  },
  origin: {
    kind: "cloud-run",
    cloudRunServiceName: "lucaszanoni-shell",
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
  accessModel: { environment: "private", audience: { kind: "owner" } },
  source: {
    appPackageName: "@platform/usage-dashboard",
    appDirectoryName: "usage-dashboard",
    buildProfile: "static-spa",
    publicBuildEnvironment: {},
    publicBuildEnvironmentReferences: {},
  },
  origin: {
    kind: "cloud-run",
    cloudRunServiceName: "lucaszanoni-usage-dashboard",
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
  accessModel: { environment: "private", audience: { kind: "owner" } },
  source: {
    appPackageName: "@platform/reports",
    appDirectoryName: "reports",
    buildProfile: "static-spa",
    publicBuildEnvironment: {},
    publicBuildEnvironmentReferences: {},
  },
  origin: {
    kind: "cloud-run",
    cloudRunServiceName: "lucaszanoni-reports",
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
  accessModel: { environment: "private", audience: { kind: "owner" } },
  origin: {
    kind: "external-https",
    originHost: "example.com",
    pathRewrite: "preserve",
    forwardedBasePath: "",
    trusted: false,
  },
};

export const cockpitApp: AppRegistryEntry = {
  id: "cockpit",
  mountPath: "/cockpit/",
  navigationLabel: "Cockpit",
  description: "Owner cockpit landing with quick access, live usage, and data.",
  showInCrossSectionNavigation: false,
  status: "active",
  accessModel: { environment: "private", audience: { kind: "owner" } },
  source: {
    appPackageName: "@platform/cockpit",
    appDirectoryName: "cockpit",
    buildProfile: "static-spa",
    publicBuildEnvironment: { VITE_COCKPIT_REAL_COMPUTE: "true" },
    publicBuildEnvironmentReferences: {
      VITE_COCKPIT_GITLAB_BASE_URL: "COCKPIT_GITLAB_BASE_URL",
      VITE_COCKPIT_GITLAB_PROJECT: "COCKPIT_GITLAB_PROJECT",
      VITE_COCKPIT_WORKSPACE_MACHINES: "COCKPIT_WORKSPACE_MACHINES",
    },
  },
  origin: { kind: "cloudflare-worker", scriptName: "lucaszanoni-cockpit" },
};

export { terminalSessionApp, kiraSessionApp, rinSessionApp };

export const workspaceApp: AppRegistryEntry = {
  id: "workspace",
  mountPath: "/workspace/",
  navigationLabel: "Workspace",
  description:
    "Owner-only keyboard-first terminal that orchestrates AI agent sessions across the owner's machines over tmux.",
  showInCrossSectionNavigation: false,
  status: "active",
  accessModel: { environment: "private", audience: { kind: "owner" } },
  source: {
    appPackageName: "@platform/workspace",
    appDirectoryName: "workspace",
    buildProfile: "static-spa",
    publicBuildEnvironment: {},
    publicBuildEnvironmentReferences: {},
  },
  origin: {
    kind: "cloud-run",
    cloudRunServiceName: "lucaszanoni-workspace",
    nonSecretEnvironment: {},
    secretEnvironmentReferences: {},
  },
};

export { dynamicIaCanvasApp, dynamicIaInterfacesApp, ingestApp };

export const stackLauncherApp: AppRegistryEntry = {
  id: "stack-launcher",
  mountPath: "/stack/",
  navigationLabel: "Stack",
  description: "Owner-only launcher for the self-hosted arr-stack apps.",
  showInCrossSectionNavigation: false,
  status: "active",
  accessModel: { environment: "private", audience: { kind: "owner" } },
  source: {
    appPackageName: "@platform/stack-launcher",
    appDirectoryName: "stack-launcher",
    buildProfile: "static-spa",
    publicBuildEnvironment: {},
    publicBuildEnvironmentReferences: {
      VITE_ARR_STACK_TAILNET_HOST: "ARR_STACK_TAILNET_HOST",
    },
  },
  origin: {
    kind: "cloudflare-worker",
    scriptName: "lucaszanoni-stack-launcher",
  },
};

export const todaysApps: readonly AppRegistryEntry[] = [
  shellApp,
  usageDashboardApp,
  reportsApp,
  dbApp,
  cockpitApp,
  terminalSessionApp,
  kiraSessionApp,
  rinSessionApp,
  workspaceApp,
  dynamicIaCanvasApp,
  dynamicIaInterfacesApp,
  stackLauncherApp,
  ingestApp,
];
