import { describe, expect, it } from "vitest";
import { parseAppRegistry } from "../../src/app-registry/parser.ts";
import { shellApp } from "./test-fixtures";

const source = {
  appPackageName: "@platform/shell",
  appDirectoryName: "shell",
  buildProfile: "static-spa",
  publicBuildEnvironment: {},
  publicBuildEnvironmentReferences: {},
};

describe("deployment source independence", () => {
  it("changes hosting without changing build identity or access", () => {
    const origins = [
      {
        kind: "cloud-run",
        cloudRunServiceName: "lucaszanoni-shell",
        nonSecretEnvironment: {},
        secretEnvironmentReferences: {},
      },
      { kind: "cloudflare-worker", scriptName: "lucaszanoni-shell" },
    ];
    for (const origin of origins) {
      const [application] = parseAppRegistry([{ ...shellApp, source, origin }]);
      expect(application).toMatchObject({
        source,
        origin,
        mountPath: shellApp.mountPath,
        accessModel: shellApp.accessModel,
      });
    }
  });

  it("declares AI capability without a provider credential name", () => {
    const [application] = parseAppRegistry([
      {
        ...shellApp,
        source,
        origin: { kind: "cloudflare-worker", scriptName: "lucaszanoni-shell" },
        capabilities: ["generative-ai"],
      },
    ]);
    expect(application).toHaveProperty("capabilities", ["generative-ai"]);
  });
});
