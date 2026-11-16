import { appRegistry as canonicalRegistry } from "../../../../packages/config/src/app-registry.ts";
import { createEdgeProductionConfiguration } from "../../../edge-router/edge-production-configuration.mjs";

const syntheticExternalOriginApplicationIds = ["shell", "reports"];

export const appRegistry = canonicalRegistry
  .filter((application) =>
    ["shell", "cockpit", "reports"].includes(application.id),
  )
  .map((application) => ({ ...application, capabilities: [] }))
  .map((application) =>
    syntheticExternalOriginApplicationIds.includes(application.id)
      ? {
          ...application,
          origin: {
            kind: "external-https",
            originHost: `${application.id}.example.com`,
            pathRewrite: "preserve",
            forwardedBasePath: "",
            trusted: false,
          },
        }
      : application,
  );

export const edgeProductionConfiguration = createEdgeProductionConfiguration({
  dotcomCanonical: true,
  kiraSessionTunnel: true,
  rinSessionTunnel: true,
});

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
