import type { AppRegistryEntry } from "../src/app-registry-types";

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

export const ingestApp: AppRegistryEntry = {
  id: "ingest",
  mountPath: "/ingest/",
  navigationLabel: "Ingest",
  description:
    "Contract-checked ingestion api that stores producer snapshots under a registered topic.",
  showInCrossSectionNavigation: false,
  status: "active",
  accessModel: { environment: "public" },
  origin: {
    kind: "in-repo-cloud-run",
    cloudRunServiceName: "lucaszanoni-ingest",
    appPackageName: "@platform/ingest",
    appDirectoryName: "ingest",
    buildProfile: "dynamic-service",
    nonSecretEnvironment: {
      APP_SERVER_ENTRYPOINT_PATH: "server-entrypoint.mjs",
      SNAPSHOT_BUCKET_NAME: "zg-url-shortener-2026-dotfiles-usage-snapshots",
    },
    secretEnvironmentReferences: {
      INGEST_PRODUCER_SECRET: "ingest-producer-secret",
    },
  },
};
