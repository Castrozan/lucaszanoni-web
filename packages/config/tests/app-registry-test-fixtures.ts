import type { AppRegistryEntry } from "../src/app-registry-types";
import {
  jarvisSessionApp,
  kiraSessionApp,
  rinSessionApp,
} from "./app-registry-session-fixtures";

export const shellApp: AppRegistryEntry = {
  id: "shell",
  mountPath: "/",
  navigationLabel: "Home",
  description: "Platform overview and entry point.",
  showInCrossSectionNavigation: false,
  status: "active",
  accessModel: { environment: "public" },
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
  accessModel: { environment: "private", audience: { kind: "owner" } },
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
  accessModel: { environment: "private", audience: { kind: "owner" } },
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
  origin: {
    kind: "in-repo-cloud-run",
    cloudRunServiceName: "lucaszanoni-cockpit",
    appPackageName: "@platform/cockpit",
    appDirectoryName: "cockpit",
    buildProfile: "static-spa",
    nonSecretEnvironment: {},
    secretEnvironmentReferences: {},
  },
};

export { jarvisSessionApp, kiraSessionApp, rinSessionApp };

export const workspaceApp: AppRegistryEntry = {
  id: "workspace",
  mountPath: "/workspace/",
  navigationLabel: "Workspace",
  description:
    "Owner-only keyboard-first terminal that orchestrates AI agent sessions across the owner's machines over tmux.",
  showInCrossSectionNavigation: false,
  status: "active",
  accessModel: { environment: "private", audience: { kind: "owner" } },
  origin: {
    kind: "in-repo-cloud-run",
    cloudRunServiceName: "lucaszanoni-workspace",
    appPackageName: "@platform/workspace",
    appDirectoryName: "workspace",
    buildProfile: "static-spa",
    nonSecretEnvironment: {},
    secretEnvironmentReferences: {},
  },
};

export const dynamicIaCanvasApp: AppRegistryEntry = {
  id: "dynamic-ia-canvas",
  mountPath: "/dynamic-ia-canvas/",
  navigationLabel: "Dynamic IA Canvas",
  description:
    "AI-driven generative component canvas that renders interfaces from natural language prompts.",
  showInCrossSectionNavigation: true,
  status: "active",
  accessModel: { environment: "public" },
  origin: {
    kind: "in-repo-cloud-run",
    cloudRunServiceName: "lucaszanoni-dynamic-ia-canvas",
    appPackageName: "@platform/dynamic-ia-canvas",
    appDirectoryName: "dynamic-ia-canvas",
    buildProfile: "dynamic-service",
    nonSecretEnvironment: {
      APP_SERVER_ENTRYPOINT_PATH: "server-entrypoint.mjs",
    },
    secretEnvironmentReferences: {
      GOOGLE_GENERATIVE_AI_API_KEY: "dynamic-ia-gemini-api-key",
    },
  },
};

export const dynamicIaInterfacesApp: AppRegistryEntry = {
  id: "dynamic-ia-interfaces",
  mountPath: "/dynamic-ia-interfaces/",
  navigationLabel: "Dynamic IA Interfaces",
  description:
    "AI-driven generative interfaces explorer that streams chat-composed UIs from natural language prompts.",
  showInCrossSectionNavigation: true,
  status: "active",
  accessModel: { environment: "public" },
  origin: {
    kind: "in-repo-cloud-run",
    cloudRunServiceName: "lucaszanoni-dynamic-ia-interfaces",
    appPackageName: "@platform/dynamic-ia-interfaces",
    appDirectoryName: "dynamic-ia-interfaces",
    buildProfile: "dynamic-service",
    nonSecretEnvironment: {
      APP_SERVER_ENTRYPOINT_PATH: "server-entrypoint.mjs",
    },
    secretEnvironmentReferences: {
      GOOGLE_GENERATIVE_AI_API_KEY: "dynamic-ia-gemini-api-key",
    },
  },
};

export const stackLauncherApp: AppRegistryEntry = {
  id: "stack-launcher",
  mountPath: "/stack/",
  navigationLabel: "Stack",
  description: "Owner-only launcher for the self-hosted arr-stack apps.",
  showInCrossSectionNavigation: false,
  status: "active",
  accessModel: { environment: "private", audience: { kind: "owner" } },
  origin: {
    kind: "in-repo-cloud-run",
    cloudRunServiceName: "lucaszanoni-stack-launcher",
    appPackageName: "@platform/stack-launcher",
    appDirectoryName: "stack-launcher",
    buildProfile: "static-spa",
    nonSecretEnvironment: {},
    secretEnvironmentReferences: {},
  },
};

export const todaysApps: readonly AppRegistryEntry[] = [
  shellApp,
  usageDashboardApp,
  reportsApp,
  dbApp,
  cockpitApp,
  jarvisSessionApp,
  kiraSessionApp,
  rinSessionApp,
  workspaceApp,
  dynamicIaCanvasApp,
  dynamicIaInterfacesApp,
  stackLauncherApp,
];
