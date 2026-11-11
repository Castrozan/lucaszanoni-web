import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { appRegistry as canonicalRegistry } from "../../../packages/config/src/app-registry.ts";
import {
  assertPrivateApplicationAccess,
  createApplicationBuildEnvironment,
  createSiteDeploymentPlan,
} from "../../cloudflare/application-deployment.mjs";

const appRegistry = canonicalRegistry.filter((application) =>
  ["shell", "cockpit", "reports"].includes(application.id),
);

const routes = {
  shell: "shell.run.app",
  prefixes: [{ prefix: "/reports/", host: "reports.run.app" }],
  workerAssetsPrefixes: [{ prefix: "/cockpit/" }],
  externalHttpsPrefixes: [
    { prefix: "/cockpit/terminal-session/", originHost: "bridge.example.com" },
  ],
  subdomains: [{ host: "media.example.com" }],
};
const settings = {
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

function twoApplicationRegistry() {
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
  assert.equal(updatedRoutes.shell, null);
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
  for (const key of [
    "prefixes",
    "externalHttpsPrefixes",
    "subdomains",
    "shell",
  ])
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

test("retains declared public build settings without enabling simulated production sessions", () => {
  const source = appRegistry.find(
    (application) => application.id === "cockpit",
  ).source;
  const environment = createApplicationBuildEnvironment(source, {
    COCKPIT_WORKSPACE_MACHINES: "machines",
    COCKPIT_GITLAB_PROJECT: "Castrozan/lucaszanoni-web",
    COCKPIT_GITLAB_BASE_URL: "https://gitlab.com",
    VITE_COCKPIT_REAL_COMPUTE: "false",
  });
  assert.equal(environment.VITE_COCKPIT_WORKSPACE_MACHINES, "machines");
  assert.equal(
    environment.VITE_COCKPIT_GITLAB_PROJECT,
    "Castrozan/lucaszanoni-web",
  );
  assert.equal(environment.VITE_COCKPIT_GITLAB_BASE_URL, "https://gitlab.com");
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

test("active production deploys the registry through Cloudflare without GCP authentication or apply", () => {
  const production = readFileSync(
    new URL("../../../.github/workflows/ci.yml", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(
    production,
    /google-github-actions\/auth|terraform.*apply|gcloud|deploy-app.sh/,
  );
  assert.match(production, /node deploy\/cloudflare\/deploy-site.mjs/);
});

test("private apps require an existing non-bypass Access perimeter before rollout", () => {
  const applications = createSiteDeploymentPlan(
    settings,
    appRegistry,
    "/repository",
  ).applications;
  const gate = {
    domain: "lucaszanoni.com/cockpit",
    type: "self_hosted",
    policies: [{ decision: "allow" }],
  };
  assert.doesNotThrow(() =>
    assertPrivateApplicationAccess(applications, [gate], "lucaszanoni.com"),
  );
  assert.throws(
    () => assertPrivateApplicationAccess(applications, [], "lucaszanoni.com"),
    /requires an existing/,
  );
  assert.throws(
    () =>
      assertPrivateApplicationAccess(
        applications,
        [{ ...gate, policies: [{ decision: "bypass" }] }],
        "lucaszanoni.com",
      ),
    /non-bypass/,
  );
  assert.throws(
    () => assertPrivateApplicationAccess(applications, [gate], undefined),
    /CLOUDFLARE_SITE_HOSTNAME/,
  );
});

test("private routing preserves deliberate public child exceptions but cannot inherit a bypass", () => {
  const application = createSiteDeploymentPlan(
    settings,
    appRegistry,
    "/repository",
  ).applications[0];
  const allow = {
    domain: "lucaszanoni.com/cockpit",
    type: "self_hosted",
    policies: [{ decision: "allow" }],
  };
  const bypass = {
    domain: "lucaszanoni.com/cockpit/local-cockpit.py",
    type: "self_hosted",
    policies: [{ decision: "bypass" }],
  };
  assert.doesNotThrow(() =>
    assertPrivateApplicationAccess(
      [application],
      [allow, bypass],
      "lucaszanoni.com",
    ),
  );
  const inherited = {
    ...application,
    mountPath: "/cockpit/local-cockpit.py/private/",
    accessApplicationProvisioning: {
      kind: "inherited-from-parent-path",
      parentMountPath: "/cockpit/",
    },
  };
  assert.throws(
    () =>
      assertPrivateApplicationAccess(
        [inherited],
        [allow, bypass],
        "lucaszanoni.com",
      ),
    /inherit an Access bypass/,
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
