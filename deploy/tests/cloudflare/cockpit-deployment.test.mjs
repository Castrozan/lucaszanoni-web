import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import {
  createCockpitDeploymentConfiguration,
  createCockpitBuildEnvironment,
} from "../../cloudflare/deploy-cockpit.mjs";

const registry = [
  {
    id: "cockpit",
    mountPath: "/cockpit/",
    origin: { kind: "in-repo-worker-assets", appDirectoryName: "cockpit" },
  },
];
const routes = {
  shell: "shell.run.app",
  prefixes: [
    { prefix: "/cockpit/", host: "old.run.app" },
    { prefix: "/reports/", host: "reports.run.app" },
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

test("moves only the Cockpit route and preserves API, subdomain and unrelated application routes", () => {
  const configuration = createCockpitDeploymentConfiguration(
    settings,
    registry,
    "/repository",
  );
  const updatedRoutes = JSON.parse(configuration.vars.EDGE_ROUTES);
  assert.deepEqual(updatedRoutes.prefixes, [routes.prefixes[1]]);
  assert.deepEqual(updatedRoutes.workerAssetsPrefixes, [
    { prefix: "/cockpit/" },
  ]);
  assert.deepEqual(
    updatedRoutes.externalHttpsPrefixes,
    routes.externalHttpsPrefixes,
  );
  assert.deepEqual(updatedRoutes.subdomains, routes.subdomains);
  assert.equal(updatedRoutes.shell, routes.shell);
  assert.equal(JSON.parse(settings.bindings[0].text).prefixes.length, 2);
});

test("keeps the asset store inside the existing private Worker and preserves deployment variables", () => {
  const configuration = createCockpitDeploymentConfiguration(
    settings,
    registry,
    "/repository",
  );
  assert.equal(configuration.workers_dev, false);
  assert.equal(configuration.preview_urls, false);
  assert.equal(configuration.keep_vars, true);
  assert.equal(configuration.assets.binding, "ASSETS");
  assert.equal(configuration.assets.run_worker_first, true);
  assert.equal(
    configuration.assets.not_found_handling,
    "single-page-application",
  );
  assert.equal(configuration.assets.directory, "/repository/apps/cockpit/dist");
  assert.equal(
    configuration.vars.EDGE_SHARED_SECRET_HEADER_NAME,
    "X-Edge-Auth",
  );
  assert.equal(Object.hasOwn(configuration.vars, "EDGE_SHARED_SECRET"), false);
});

test("rejects ambiguous asset deployments instead of serving one app's assets for another", () => {
  assert.throws(
    () => createCockpitDeploymentConfiguration(settings, [], "/repository"),
    /exactly one/,
  );
  assert.throws(
    () =>
      createCockpitDeploymentConfiguration(
        settings,
        [...registry, { ...registry[0], id: "other" }],
        "/repository",
      ),
    /exactly one/,
  );
});

test("forwards current non-secret build settings and never switches production to simulated sessions", () => {
  const environment = createCockpitBuildEnvironment({
    COCKPIT_WORKSPACE_MACHINES: "machines",
    COCKPIT_GITLAB_PROJECT: "Castrozan/lucaszanoni-web",
    COCKPIT_GITLAB_BASE_URL: "https://gitlab.com",
  });
  assert.equal(environment.VITE_COCKPIT_WORKSPACE_MACHINES, "machines");
  assert.equal(
    environment.VITE_COCKPIT_GITLAB_PROJECT,
    "Castrozan/lucaszanoni-web",
  );
  assert.equal(environment.VITE_COCKPIT_GITLAB_BASE_URL, "https://gitlab.com");
  assert.equal(environment.VITE_COCKPIT_REAL_COMPUTE, "true");
});

test("the active production pipeline deploys Cloudflare without GCP authentication or infrastructure apply", () => {
  const root = readFileSync(
    new URL("../../../.gitlab-ci.yml", import.meta.url),
    "utf8",
  );
  const production = readFileSync(
    new URL("../../../.gitlab/ci/cloudflare.yml", import.meta.url),
    "utf8",
  );
  assert.match(root, /local: .gitlab\/ci\/cloudflare.yml/);
  assert.doesNotMatch(root, /local: .gitlab\/ci\/production.yml/);
  assert.doesNotMatch(
    production,
    /authenticate-google-cloud|terraform.*apply|gcloud|deploy-app.sh/,
  );
  assert.match(production, /node deploy\/cloudflare\/deploy-cockpit.mjs/);
});
