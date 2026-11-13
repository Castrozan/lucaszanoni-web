import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
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
  test(`${applicationId} keeps native, framework and deployment output paths aligned`, async () => {
    const applicationDirectory = resolve(
      repositoryDirectory,
      "apps",
      applicationId,
    );
    const next = (
      await import(
        new URL(
          `../../../apps/${applicationId}/next.config.mjs`,
          import.meta.url,
        )
      )
    ).default;
    const adapter = (
      await import(
        new URL(
          `../../../apps/${applicationId}/cloudflare/open-next.config.ts`,
          import.meta.url,
        )
      )
    ).default;
    const configurationPath = resolve(
      applicationDirectory,
      "cloudflare/wrangler.json",
    );
    const configuration = JSON.parse(readFileSync(configurationPath, "utf8"));
    const application = appRegistry.find(
      (candidate) => candidate.id === applicationId,
    );
    const profile = createApplicationRuntimeProfile(
      { source: application.source, target: application.origin },
      { compatibility_date: "2024-11-01" },
      repositoryDirectory,
    );
    assert.equal(next.distDir, `${adapter.buildOutputPath}/.next`);
    assert.equal(
      resolve(dirname(configurationPath), configuration.main),
      profile.main,
    );
    assert.equal(
      resolve(dirname(configurationPath), configuration.assets.directory),
      profile.assets.directory,
    );
    assert.equal(configuration.compatibility_date, profile.compatibility_date);
    assert.deepEqual(configuration.ai, { binding: "AI" });
    assert.equal(configuration.workers_dev, false);
    assert.equal(configuration.preview_urls, false);
  });
}

test("both rollout and native verification use the declared profile build command", () => {
  const commands = {
    "static-spa": "build",
    "worker-service": "build",
    "dynamic-service": "build:worker",
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
