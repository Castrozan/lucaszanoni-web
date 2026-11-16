import assert from "node:assert/strict";
import { test } from "node:test";
import { createSiteDeploymentPlan } from "../../../cloudflare/application-deployment.mjs";
import {
  appRegistry,
  edgeProductionConfiguration,
  twoApplicationRegistry,
} from "./fixtures.mjs";

test("deploys any number of independent static apps without Cockpit-specific code", () => {
  const plan = createSiteDeploymentPlan(
    edgeProductionConfiguration,
    twoApplicationRegistry(),
    "/repository",
  );
  assert.deepEqual(
    plan.applications.map((application) => application.applicationId),
    ["cockpit", "shell"],
  );
  assert.deepEqual(plan.edgeConfiguration.services, [
    { binding: "APP_COCKPIT", service: "lucaszanoni-cockpit" },
    { binding: "APP_SHELL", service: "lucaszanoni-shell" },
  ]);
  const updatedRoutes = JSON.parse(plan.edgeConfiguration.vars.EDGE_ROUTES);
  assert.equal(Object.hasOwn(updatedRoutes, "shell"), false);
  assert.equal(Object.hasOwn(updatedRoutes, "prefixes"), false);
  assert.deepEqual(updatedRoutes.workerServicePrefixes, [
    { prefix: "/cockpit/", binding: "APP_COCKPIT" },
    { prefix: "/", binding: "APP_SHELL" },
  ]);
});

test("keeps public and private asset stores isolated and disables public Worker URLs", () => {
  const plan = createSiteDeploymentPlan(
    edgeProductionConfiguration,
    twoApplicationRegistry(),
    "/repository",
  );
  assert.equal(Object.hasOwn(plan.edgeConfiguration, "assets"), false);
  assert.equal(plan.edgeConfiguration.keep_vars, false);
  for (const configuration of [
    ...plan.applications.map((application) => application.configuration),
    plan.edgeConfiguration,
  ]) {
    assert.equal(configuration.workers_dev, false);
    assert.equal(configuration.preview_urls, false);
    assert.equal(
      Object.hasOwn(configuration.vars, "EDGE_SHARED_SECRET"),
      false,
    );
  }
  for (const application of plan.applications) {
    assert.equal(
      application.configuration.assets.directory,
      `/repository/apps/${application.applicationId}/dist`,
    );
    assert.equal(application.configuration.assets.binding, "ASSETS");
    assert.equal(
      application.configuration.assets.not_found_handling,
      "single-page-application",
    );
    assert.equal(application.configuration.assets.run_worker_first, true);
  }
});

test("computes the edge router entirely from the repository without mutating its inputs", () => {
  const originalConfiguration = structuredClone(edgeProductionConfiguration);
  const configuration = createSiteDeploymentPlan(
    edgeProductionConfiguration,
    appRegistry,
    "/repository",
  ).edgeConfiguration;
  assert.equal(configuration.name, "lucaszanoni-edge-router");
  assert.equal(
    configuration.main,
    "/repository/deploy/edge-router/edge-router-worker.mjs",
  );
  assert.equal(configuration.compatibility_date, "2024-11-01");
  assert.deepEqual(configuration.compatibility_flags, []);
  assert.deepEqual(Object.keys(configuration.vars).sort(), [
    "EDGE_ROUTES",
    "EDGE_SHARED_SECRET_HEADER_NAME",
  ]);
  assert.equal(
    configuration.vars.EDGE_SHARED_SECRET_HEADER_NAME,
    "X-Edge-Auth",
  );
  assert.deepEqual(edgeProductionConfiguration, originalConfiguration);
  assert.deepEqual(
    createSiteDeploymentPlan(
      edgeProductionConfiguration,
      appRegistry,
      "/repository",
    ),
    createSiteDeploymentPlan(
      edgeProductionConfiguration,
      appRegistry,
      "/repository",
    ),
  );
});

test("retirement removes the app service and declares Gone", () => {
  const retiredRegistry = appRegistry.map((application) =>
    application.id === "cockpit"
      ? { ...application, status: "retired" }
      : application,
  );
  const plan = createSiteDeploymentPlan(
    edgeProductionConfiguration,
    retiredRegistry,
    "/repository",
  );
  const routing = JSON.parse(plan.edgeConfiguration.vars.EDGE_ROUTES);
  assert.equal(plan.applications.length, 0);
  assert.deepEqual(routing.retiredPrefixes, [{ prefix: "/cockpit/" }]);
  assert.deepEqual(routing.workerServicePrefixes, []);
  assert.deepEqual(plan.edgeConfiguration.services, []);
});
