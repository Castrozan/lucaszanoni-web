import assert from "node:assert/strict";
import { test } from "node:test";
import { appRegistry } from "../../../packages/config/src/app-registry.ts";
import edgeWorker from "../../../infra/modules/cloudflare-edge/edge-router-worker.mjs";
import { createSiteDeploymentPlan } from "../../cloudflare/application-deployment.mjs";

const routing = {
  prefixes: [],
  externalHttpsPrefixes: [{ prefix: "/db/", originHost: "example.com" }],
  workerServicePrefixes: [{ prefix: "/", binding: "APP_SHELL" }],
  retiredPrefixes: [{ prefix: "/db/" }],
};

const environment = {
  EDGE_ROUTES: JSON.stringify(routing),
  APP_SHELL: { fetch: async () => new Response("shell", { status: 200 }) },
};

test("the unused database placeholder is retired without changing its private perimeter", () => {
  const database = appRegistry.find((application) => application.id === "db");
  assert.equal(database.status, "retired");
  assert.equal(database.mountPath, "/db/");
  assert.deepEqual(database.accessModel, {
    environment: "private",
    audience: { kind: "owner" },
  });
});

test("the existing deployment adapter projects database retirement while preserving unrelated routes", () => {
  const settings = {
    compatibility_date: "2024-11-01",
    bindings: [
      {
        name: "EDGE_ROUTES",
        type: "plain_text",
        text: JSON.stringify({
          ...routing,
          retiredPrefixes: [{ prefix: "/previously-retired/" }],
        }),
      },
    ],
  };
  const plan = createSiteDeploymentPlan(settings, appRegistry, "/repository");
  const deployed = JSON.parse(plan.edgeConfiguration.vars.EDGE_ROUTES);
  assert.deepEqual(deployed.retiredPrefixes, [
    { prefix: "/previously-retired/" },
    { prefix: "/db/" },
  ]);
  assert.deepEqual(
    deployed.externalHttpsPrefixes,
    routing.externalHttpsPrefixes,
  );
  assert.equal(
    plan.applications.some((application) => application.applicationId === "db"),
    false,
  );
});

test("database retirement returns Gone for bare, canonical, nested and query paths", async () => {
  for (const pathname of [
    "/db",
    "/db/",
    "/db/nested/page",
    "/db?source=old-link",
    "/db/nested?source=old-link",
  ]) {
    const response = await edgeWorker.fetch(
      new Request(`https://lucaszanoni.com${pathname}`),
      environment,
    );
    assert.equal(response.status, 410, pathname);
  }
});

test("database retirement never captures sibling path prefixes", async () => {
  for (const pathname of [
    "/database/",
    "/db-old/",
    "/db2/",
    "/",
    "/cockpit/",
  ]) {
    const response = await edgeWorker.fetch(
      new Request(`https://lucaszanoni.com${pathname}`),
      environment,
    );
    assert.equal(response.status, 200, pathname);
    assert.equal(await response.text(), "shell");
  }
});
