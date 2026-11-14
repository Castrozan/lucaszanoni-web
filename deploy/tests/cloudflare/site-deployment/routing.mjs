import assert from "node:assert/strict";
import { test } from "node:test";
import { createSiteDeploymentPlan } from "../../../cloudflare/application-deployment.mjs";
import {
  appRegistry,
  routes,
  settings,
  twoApplicationRegistry,
} from "./fixtures.mjs";

test("deploys any number of independent static apps without Cockpit-specific code", () => {
  const plan = createSiteDeploymentPlan(
    settings,
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
  assert.equal(Object.hasOwn(updatedRoutes, "workerAssetsPrefixes"), false);
});

test("keeps public and private asset stores isolated and disables public Worker URLs", () => {
  const plan = createSiteDeploymentPlan(
    settings,
    twoApplicationRegistry(),
    "/repository",
  );
  assert.equal(Object.hasOwn(plan.edgeConfiguration, "assets"), false);
  assert.equal(plan.edgeConfiguration.keep_vars, true);
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

test("preserves unrelated HTTP, API, subdomain, secret-header and current input state", () => {
  const originalSettings = structuredClone(settings);
  const configuration = createSiteDeploymentPlan(
    settings,
    appRegistry,
    "/repository",
  ).edgeConfiguration;
  const actual = JSON.parse(configuration.vars.EDGE_ROUTES);
  for (const key of ["externalHttpsPrefixes", "subdomains"])
    assert.deepEqual(actual[key], routes[key]);
  assert.equal(
    configuration.vars.EDGE_SHARED_SECRET_HEADER_NAME,
    "X-Edge-Auth",
  );
  assert.deepEqual(settings, originalSettings);
  assert.deepEqual(
    createSiteDeploymentPlan(settings, appRegistry, "/repository"),
    createSiteDeploymentPlan(settings, appRegistry, "/repository"),
  );
});

test("retirement removes the app service and declares Gone without removing unrelated retired paths", () => {
  const deployed = createSiteDeploymentPlan(
    settings,
    appRegistry,
    "/repository",
  ).edgeConfiguration;
  const routing = JSON.parse(deployed.vars.EDGE_ROUTES);
  routing.retiredPrefixes = [{ prefix: "/archived-external/" }];
  const current = {
    ...settings,
    bindings: [
      ...settings.bindings.filter(
        (binding) =>
          binding.name !== "EDGE_ROUTES" && binding.type !== "assets",
      ),
      {
        name: "EDGE_ROUTES",
        type: "plain_text",
        text: JSON.stringify(routing),
      },
      { name: "APP_COCKPIT", type: "service", service: "lucaszanoni-cockpit" },
    ],
  };
  const retiredRegistry = appRegistry.map((application) =>
    application.id === "cockpit"
      ? { ...application, status: "retired" }
      : application,
  );
  const plan = createSiteDeploymentPlan(
    current,
    retiredRegistry,
    "/repository",
  );
  assert.equal(plan.applications.length, 0);
  assert.deepEqual(
    JSON.parse(plan.edgeConfiguration.vars.EDGE_ROUTES).retiredPrefixes,
    [{ prefix: "/archived-external/" }, { prefix: "/cockpit/" }],
  );
  assert.deepEqual(plan.edgeConfiguration.services, []);
});

for (const [description, hostProxyRoutes] of [
  [
    "an unowned host prefix",
    { prefixes: [{ prefix: "/old/", host: "old.example.com" }] },
  ],
  ["a shell host", { shell: "shell.example.com" }],
  [
    "a subdomain carrying the shared secret",
    { subdomains: [{ host: "media.example.com", originKind: "cloud-run" }] },
  ],
]) {
  test(`refuses to deploy over ${description}`, () => {
    const current = {
      ...settings,
      bindings: settings.bindings.map((binding) =>
        binding.name === "EDGE_ROUTES"
          ? {
              ...binding,
              text: JSON.stringify({ ...routes, ...hostProxyRoutes }),
            }
          : binding,
      ),
    };
    assert.throws(
      () =>
        createSiteDeploymentPlan(
          current,
          twoApplicationRegistry(),
          "/repository",
        ),
      /Host-proxy edge routes require inspection/,
    );
  });
}

test("keeps the empty host-proxy fields the deployed router still reads", () => {
  const current = {
    ...settings,
    bindings: settings.bindings.map((binding) =>
      binding.name === "EDGE_ROUTES"
        ? {
            ...binding,
            text: JSON.stringify({ ...routes, shell: null, prefixes: [] }),
          }
        : binding,
    ),
  };
  const deployedRoutes = JSON.parse(
    createSiteDeploymentPlan(current, twoApplicationRegistry(), "/repository")
      .edgeConfiguration.vars.EDGE_ROUTES,
  );
  assert.equal(deployedRoutes.shell, null);
  assert.deepEqual(deployedRoutes.prefixes, []);
});
