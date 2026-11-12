import assert from "node:assert/strict";
import { test } from "node:test";
import { appRegistry } from "../../../packages/config/src/app-registry.ts";
import {
  createApplicationBuildEnvironment,
  createSiteDeploymentPlan,
} from "../../cloudflare/application-deployment.mjs";

const remainingStaticApplications = [
  {
    id: "shell",
    mountPath: "/",
    accessModel: { environment: "public" },
  },
  {
    id: "usage-dashboard",
    mountPath: "/engineering/dotfiles/claude/usage/",
    accessModel: { environment: "private", audience: { kind: "owner" } },
  },
  {
    id: "reports",
    mountPath: "/engineering/dotfiles/reports/",
    accessModel: { environment: "private", audience: { kind: "owner" } },
  },
  {
    id: "workspace",
    mountPath: "/workspace/",
    accessModel: { environment: "private", audience: { kind: "owner" } },
  },
];

const remainingStaticApplicationIds = remainingStaticApplications.map(
  (application) => application.id,
);

const workerApplicationIds = [
  "cockpit",
  "shell",
  "usage-dashboard",
  "reports",
  "workspace",
  "stack-launcher",
];

const routes = {
  shell: null,
  prefixes: [
    {
      prefix: "/engineering/dotfiles/claude/usage/",
      host: "usage-dashboard.run.app",
    },
    { prefix: "/engineering/dotfiles/reports/", host: "reports.run.app" },
    { prefix: "/workspace/", host: "workspace.run.app" },
    { prefix: "/ingest/", host: "ingest.run.app" },
  ],
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
  ],
};

function findApplication(identifier) {
  return appRegistry.find((application) => application.id === identifier);
}

function planFor(registry) {
  return createSiteDeploymentPlan(settings, registry, "/repository");
}

test("the four remaining static apps are canonical Cloudflare Worker targets", () => {
  for (const expected of remainingStaticApplications) {
    const application = findApplication(expected.id);
    assert.ok(application, `${expected.id} is registered`);
    assert.equal(application.status, "active");
    assert.equal(application.mountPath, expected.mountPath);
    assert.deepEqual(application.accessModel, expected.accessModel);
    assert.deepEqual(application.origin, {
      kind: "cloudflare-worker",
      scriptName: `lucaszanoni-${expected.id}`,
    });
    assert.equal(application.source.appPackageName, `@platform/${expected.id}`);
    assert.equal(application.source.appDirectoryName, expected.id);
    assert.equal(application.source.buildProfile, "static-spa");
  }
  const remainingCloudRunIds = appRegistry
    .filter((application) => application.origin.kind === "cloud-run")
    .map((application) => application.id);
  for (const identifier of remainingStaticApplicationIds)
    assert.equal(remainingCloudRunIds.includes(identifier), false);
});

test("Workspace resolves the real compute flag and machine endpoint even when the caller supplies false", () => {
  const workspace = findApplication("workspace");
  const environment = createApplicationBuildEnvironment(workspace.source, {
    COCKPIT_WORKSPACE_MACHINES: "machines",
    VITE_COCKPIT_REAL_COMPUTE: "false",
  });
  assert.equal(environment.VITE_COCKPIT_REAL_COMPUTE, "true");
  assert.equal(environment.VITE_COCKPIT_WORKSPACE_MACHINES, "machines");
});

test("each remaining static app is its own Worker asset service with public endpoints disabled", () => {
  const plan = planFor(appRegistry);
  assert.deepEqual(
    plan.applications.map((application) => application.applicationId).sort(),
    [...workerApplicationIds].sort(),
  );
  const assetDirectories = plan.applications.map(
    (application) => application.configuration.assets.directory,
  );
  assert.equal(new Set(assetDirectories).size, workerApplicationIds.length);
  for (const identifier of remainingStaticApplicationIds) {
    const application = plan.applications.find(
      (candidate) => candidate.applicationId === identifier,
    );
    assert.ok(application, `${identifier} is deployed as a Worker`);
    const configuration = application.configuration;
    assert.equal(configuration.name, `lucaszanoni-${identifier}`);
    assert.equal(
      configuration.assets.directory,
      `/repository/apps/${identifier}/dist`,
    );
    assert.equal(configuration.assets.binding, "ASSETS");
    assert.equal(
      configuration.assets.not_found_handling,
      "single-page-application",
    );
    assert.equal(configuration.assets.run_worker_first, true);
    assert.equal(configuration.workers_dev, false);
    assert.equal(configuration.preview_urls, false);
    assert.equal(
      Object.hasOwn(configuration.vars, "EDGE_SHARED_SECRET"),
      false,
    );
  }
});

test("the public shell binds the root route to its Worker and drops only the old Cloud Run route fixtures", () => {
  const plan = planFor(appRegistry);
  const edgeRoutes = JSON.parse(plan.edgeConfiguration.vars.EDGE_ROUTES);
  assert.equal(edgeRoutes.shell, null);
  assert.ok(
    plan.edgeConfiguration.services.some(
      (service) =>
        service.binding === "APP_SHELL" &&
        service.service === "lucaszanoni-shell",
    ),
  );
  assert.deepEqual(edgeRoutes.workerServicePrefixes, [
    {
      prefix: "/engineering/dotfiles/claude/usage/",
      binding: "APP_USAGE_DASHBOARD",
    },
    { prefix: "/engineering/dotfiles/reports/", binding: "APP_REPORTS" },
    { prefix: "/workspace/", binding: "APP_WORKSPACE" },
    { prefix: "/cockpit/", binding: "APP_COCKPIT" },
    { prefix: "/stack/", binding: "APP_STACK_LAUNCHER" },
    { prefix: "/", binding: "APP_SHELL" },
  ]);
  assert.deepEqual(edgeRoutes.prefixes, [
    { prefix: "/ingest/", host: "ingest.run.app" },
  ]);
});

test("external API, socket and subdomain routes survive the static app migration", () => {
  const edgeRoutes = JSON.parse(
    planFor(appRegistry).edgeConfiguration.vars.EDGE_ROUTES,
  );
  assert.deepEqual(
    edgeRoutes.externalHttpsPrefixes,
    routes.externalHttpsPrefixes,
  );
  assert.deepEqual(edgeRoutes.subdomains, routes.subdomains);
  assert.deepEqual(
    planFor(appRegistry).edgeConfiguration.vars.EDGE_SHARED_SECRET_HEADER_NAME,
    "X-Edge-Auth",
  );
});
