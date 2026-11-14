import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { appRegistry } from "../../../packages/config/src/app-registry.ts";
import {
  createApplicationBuildArguments,
  createApplicationRuntimeProfile,
} from "../../cloudflare/application-runtime-profile.mjs";

const repositoryDirectory = fileURLToPath(
  new URL("../../../", import.meta.url),
);

for (const applicationId of ["dynamic-ia-canvas", "dynamic-ia-interfaces"]) {
  test(`${applicationId} keeps native build and deployment output paths aligned`, async () => {
    const applicationDirectory = resolve(
      repositoryDirectory,
      "apps",
      applicationId,
    );
    const viteConfiguration = (
      await import(
        new URL(
          `../../../apps/${applicationId}/vite.config.ts`,
          import.meta.url,
        )
      )
    ).default;
    const buildScript = JSON.parse(
      readFileSync(resolve(applicationDirectory, "package.json"), "utf8"),
    ).scripts.build;
    const application = appRegistry.find(
      (candidate) => candidate.id === applicationId,
    );
    const profile = createApplicationRuntimeProfile(
      { source: application.source, target: application.origin },
      { compatibility_date: "2024-11-01" },
      repositoryDirectory,
    );
    assert.equal(viteConfiguration.base, application.mountPath);
    assert.equal(
      resolve(applicationDirectory, viteConfiguration.build.outDir),
      profile.assets.directory,
    );
    const workerOutput = buildScript.match(/--outfile=(\S+)/)?.[1];
    assert.equal(resolve(applicationDirectory, workerOutput), profile.main);
  });
}

test("both rollout and native verification use the declared profile build command", () => {
  const commands = {
    "static-spa": "build",
    "worker-service": "build",
    "dynamic-service": "build",
  };
  for (const [buildProfile, command] of Object.entries(commands)) {
    assert.deepEqual(
      createApplicationBuildArguments({
        appPackageName: "@platform/example",
        buildProfile,
      }),
      ["--filter", "@platform/example", command],
    );
  }
});
