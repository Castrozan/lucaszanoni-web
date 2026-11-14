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
