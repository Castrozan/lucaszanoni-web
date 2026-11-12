import assert from "node:assert/strict";
import { test } from "node:test";
import { appRegistry } from "../../../packages/config/src/app-registry.ts";
import {
  assertPrivateApplicationAccess,
  createApplicationBuildEnvironment,
  createSiteDeploymentPlan,
} from "../../cloudflare/application-deployment.mjs";

const stackRoutingApplicationIds = ["cockpit", "stack-launcher"];
const stackRoutingRegistry = appRegistry.filter((application) =>
  stackRoutingApplicationIds.includes(application.id),
);

const routes = {
  shell: "shell.run.app",
  prefixes: [
    { prefix: "/stack/", host: "stack.run.app" },
    { prefix: "/reports/", host: "reports.run.app" },
  ],
  workerServicePrefixes: [{ prefix: "/cockpit/", binding: "APP_COCKPIT" }],
  externalHttpsPrefixes: [
    { prefix: "/cockpit/terminal-session/", originHost: "bridge.example.com" },
  ],
  subdomains: [{ host: "media.example.com" }],
};
const settings = {
  compatibility_date: "2024-11-01",
  bindings: [
    { name: "EDGE_ROUTES", type: "plain_text", text: JSON.stringify(routes) },
    { name: "APP_COCKPIT", type: "service", service: "lucaszanoni-cockpit" },
    { name: "EDGE_SHARED_SECRET", type: "secret_text" },
  ],
};

test("Stack retains its source, URL and owner-only audience behind a private Worker", () => {
  const stack = appRegistry.find(
    (application) => application.id === "stack-launcher",
  );
  assert.equal(stack.mountPath, "/stack/");
  assert.equal(stack.status, "active");
  assert.deepEqual(stack.accessModel, {
    environment: "private",
    audience: { kind: "owner" },
  });
  assert.deepEqual(stack.origin, {
    kind: "cloudflare-worker",
    scriptName: "lucaszanoni-stack-launcher",
  });
  assert.equal(stack.source.appPackageName, "@platform/stack-launcher");
  assert.equal(stack.source.appDirectoryName, "stack-launcher");
  assert.equal(stack.source.buildProfile, "static-spa");
  assert.equal(
    createApplicationBuildEnvironment(stack.source, {
      ARR_STACK_TAILNET_HOST: "media.example.test",
    }).VITE_ARR_STACK_TAILNET_HOST,
    "media.example.test",
  );
});

test("Stack replaces only its Cloud Run route and owns an isolated private asset service", () => {
  const before = structuredClone(settings);
  const plan = createSiteDeploymentPlan(
    settings,
    stackRoutingRegistry,
    "/repository",
  );
  const stack = plan.applications.find(
    (application) => application.applicationId === "stack-launcher",
  );
  assert.ok(stack);
  assert.equal(stack.configuration.name, "lucaszanoni-stack-launcher");
  assert.equal(
    stack.configuration.assets.directory,
    "/repository/apps/stack-launcher/dist",
  );
  assert.equal(stack.configuration.assets.binding, "ASSETS");
  assert.equal(stack.configuration.workers_dev, false);
  assert.equal(stack.configuration.preview_urls, false);
  assert.equal(stack.configuration.vars.APPLICATION_ID, "stack-launcher");
  assert.equal(stack.configuration.vars.APPLICATION_MOUNT_PATH, "/stack/");
  assert.equal(Object.hasOwn(plan.edgeConfiguration, "assets"), false);
  const actual = JSON.parse(plan.edgeConfiguration.vars.EDGE_ROUTES);
  assert.deepEqual(actual.prefixes, [
    { prefix: "/reports/", host: "reports.run.app" },
  ]);
  assert.deepEqual(actual.workerServicePrefixes, [
    { prefix: "/cockpit/", binding: "APP_COCKPIT" },
    { prefix: "/stack/", binding: "APP_STACK_LAUNCHER" },
  ]);
  assert.ok(
    plan.edgeConfiguration.services.some(
      (service) =>
        service.binding === "APP_STACK_LAUNCHER" &&
        service.service === "lucaszanoni-stack-launcher",
    ),
  );
  assert.ok(
    plan.edgeConfiguration.services.some(
      (service) =>
        service.binding === "APP_COCKPIT" &&
        service.service === "lucaszanoni-cockpit",
    ),
  );
  for (const key of ["shell", "externalHttpsPrefixes", "subdomains"])
    assert.deepEqual(actual[key], routes[key]);
  assert.deepEqual(settings, before);
  assert.throws(
    () => assertPrivateApplicationAccess([stack], [], "lucaszanoni.com"),
    /requires an existing/,
  );
  assertPrivateApplicationAccess(
    [stack],
    [
      {
        domain: "lucaszanoni.com/stack",
        type: "self_hosted",
        policies: [{ decision: "allow" }],
      },
    ],
    "lucaszanoni.com",
  );
});
