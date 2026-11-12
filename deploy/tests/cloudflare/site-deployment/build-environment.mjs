import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createApplicationBuildEnvironment,
  createSiteDeploymentPlan,
} from "../../../cloudflare/application-deployment.mjs";
import { appRegistry, settings, twoApplicationRegistry } from "./fixtures.mjs";

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

test("fails before deployment on unsupported bindings, missing adapters and binding collisions", () => {
  assert.throws(
    () =>
      createSiteDeploymentPlan(
        {
          ...settings,
          bindings: [
            ...settings.bindings,
            { name: "DATA", type: "kv_namespace" },
          ],
        },
        appRegistry,
        "/repository",
      ),
    /Unrecognized/,
  );
  assert.throws(
    () =>
      createSiteDeploymentPlan(
        {
          ...settings,
          bindings: [
            ...settings.bindings,
            { name: "APP_COCKPIT", type: "secret_text" },
          ],
        },
        appRegistry,
        "/repository",
      ),
    /collides/,
  );
  const dynamic = twoApplicationRegistry().map((application) =>
    application.id === "shell"
      ? {
          ...application,
          source: { ...application.source, buildProfile: "dynamic-service" },
        }
      : application,
  );
  assert.throws(
    () => createSiteDeploymentPlan(settings, dynamic, "/repository"),
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
    () => createSiteDeploymentPlan(settings, reserved, "/repository"),
    /overwrite/,
  );
});
