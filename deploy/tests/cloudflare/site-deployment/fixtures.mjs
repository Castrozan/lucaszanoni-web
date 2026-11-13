import { appRegistry as canonicalRegistry } from "../../../../packages/config/src/app-registry.ts";

const syntheticCloudRunOriginApplicationIds = ["shell", "reports"];

export const appRegistry = canonicalRegistry
  .filter((application) =>
    ["shell", "cockpit", "reports"].includes(application.id),
  )
  .map((application) => ({ ...application, capabilities: [] }))
  .map((application) =>
    syntheticCloudRunOriginApplicationIds.includes(application.id)
      ? {
          ...application,
          origin: {
            kind: "cloud-run",
            cloudRunServiceName: `lucaszanoni-${application.id}`,
            nonSecretEnvironment: {},
            secretEnvironmentReferences: {},
          },
        }
      : application,
  );

export const routes = {
  shell: "shell.run.app",
  prefixes: [{ prefix: "/reports/", host: "reports.run.app" }],
  workerAssetsPrefixes: [{ prefix: "/cockpit/" }],
  externalHttpsPrefixes: [
    { prefix: "/cockpit/terminal-session/", originHost: "bridge.example.com" },
  ],
  subdomains: [{ host: "media.example.com" }],
};
export const settings = {
  compatibility_date: "2024-11-01",
  bindings: [
    { name: "EDGE_ROUTES", type: "plain_text", text: JSON.stringify(routes) },
    { name: "EDGE_SHARED_SECRET", type: "secret_text" },
    {
      name: "EDGE_SHARED_SECRET_HEADER_NAME",
      type: "plain_text",
      text: "X-Edge-Auth",
    },
    { name: "ASSETS", type: "assets" },
  ],
};

export function twoApplicationRegistry() {
  return appRegistry.map((application) =>
    application.id === "shell"
      ? {
          ...application,
          origin: {
            kind: "cloudflare-worker",
            scriptName: "lucaszanoni-shell",
          },
        }
      : application,
  );
}
