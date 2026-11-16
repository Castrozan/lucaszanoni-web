import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createApplicationBuildEnvironment,
  createSiteDeploymentPlan,
} from "../../../cloudflare/application-deployment.mjs";
import {
  appRegistry,
  edgeProductionConfiguration,
  twoApplicationRegistry,
} from "./fixtures.mjs";

test("retains declared public build settings without enabling simulated production sessions", () => {
  const source = appRegistry.find(
    (application) => application.id === "cockpit",
  ).source;
  const environment = createApplicationBuildEnvironment(source, {
    COCKPIT_WORKSPACE_MACHINES: "machines",
    VITE_COCKPIT_REAL_COMPUTE: "false",
  });
  assert.equal(environment.VITE_COCKPIT_WORKSPACE_MACHINES, "machines");
  assert.equal(
    environment.VITE_COCKPIT_REPOSITORY_URL,
    "https://github.com/Castrozan/lucaszanoni-web",
  );
  assert.equal(environment.VITE_COCKPIT_REAL_COMPUTE, "true");
});

test("fails before deployment on missing adapters and an edge router overwrite", () => {
  const unsupported = twoApplicationRegistry().map((application) =>
    application.id === "shell"
      ? {
          ...application,
          source: {
            ...application.source,
            buildProfile: "unsupported-profile",
          },
        }
      : application,
  );
  assert.throws(
    () =>
      createSiteDeploymentPlan(
        edgeProductionConfiguration,
        unsupported,
        "/repository",
      ),
    /static-spa build adapter/,
  );
  const reserved = twoApplicationRegistry().map((application) =>
    application.id === "shell"
      ? {
          ...application,
          origin: {
            ...application.origin,
            scriptName: "lucaszanoni-edge-router",
          },
        }
      : application,
  );
  assert.throws(
    () =>
      createSiteDeploymentPlan(
        edgeProductionConfiguration,
        reserved,
        "/repository",
      ),
    /overwrite/,
  );
});
