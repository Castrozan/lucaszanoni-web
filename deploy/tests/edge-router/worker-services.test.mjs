import assert from "node:assert/strict";
import { test } from "node:test";
import edgeRouterWorker from "../../../infra/modules/cloudflare-edge/edge-router-worker.mjs";
import staticApplicationWorker from "../../cloudflare/static-application-worker.mjs";

function createEnvironment({ rootService = false } = {}) {
  const assetRequests = [];
  const applicationEnvironment = (id, mountPath) => ({
    APPLICATION_MOUNT_PATH: mountPath,
    ASSETS: {
      async fetch(request) {
        assetRequests.push({ id, request });
        return new Response(id);
      },
    },
  });
  const cockpit = applicationEnvironment("cockpit", "/cockpit/");
  const shell = applicationEnvironment("shell", "/");
  return {
    assetRequests,
    environment: {
      EDGE_ROUTES: JSON.stringify({
        shell: rootService ? null : "shell.example.run.app",
        prefixes: [{ prefix: "/reports/", host: "reports.example.run.app" }],
        workerServicePrefixes: [
          { prefix: "/cockpit/", binding: "APP_COCKPIT" },
          ...(rootService ? [{ prefix: "/", binding: "APP_SHELL" }] : []),
        ],
        externalHttpsPrefixes: [
          {
            prefix: "/cockpit/terminal-session/",
            originHost: "bridge.example.com",
            pathRewrite: "strip-mount-path",
            forwardedBasePath: "/",
            trusted: true,
          },
        ],
      }),
      EDGE_SHARED_SECRET_HEADER_NAME: "X-Edge-Auth",
      EDGE_SHARED_SECRET: "test-secret",
      APP_COCKPIT: {
        fetch: (request) => staticApplicationWorker.fetch(request, cockpit),
      },
      APP_SHELL: {
        fetch: (request) => staticApplicationWorker.fetch(request, shell),
      },
    },
  };
}

for (const path of [
  "/cockpit/",
  "/cockpit/dashboard",
  "/cockpit/assets/app.js?v=1",
]) {
  test(`serves ${path} through its isolated private app service`, async () => {
    const { environment, assetRequests } = createEnvironment();
    const response = await edgeRouterWorker.fetch(
      new Request(`https://lucaszanoni.com${path}`),
      environment,
    );
    assert.equal(await response.text(), "cockpit");
    const assetUrl = new URL(assetRequests[0].request.url);
    assert.equal(
      assetUrl.pathname + assetUrl.search,
      path === "/cockpit/" ? "/index.html" : path.slice("/cockpit".length),
    );
  });
}

test("canonicalizes the bare app mount while preserving the query", async () => {
  const { environment, assetRequests } = createEnvironment();
  const response = await edgeRouterWorker.fetch(
    new Request("https://lucaszanoni.com/cockpit?view=docs"),
    environment,
  );
  assert.equal(response.status, 308);
  assert.equal(
    response.headers.get("Location"),
    "https://lucaszanoni.com/cockpit/?view=docs",
  );
  assert.equal(assetRequests.length, 0);
});

test("isolates public and private fallbacks even with an encoded namespace path", async () => {
  const { environment, assetRequests } = createEnvironment({
    rootService: true,
  });
  for (const [path, id] of [
    ["/", "shell"],
    ["/about", "shell"],
    ["/cockpit/docs", "cockpit"],
    ["/%63ockpit/index.html", "shell"],
  ]) {
    const response = await edgeRouterWorker.fetch(
      new Request(`https://lucaszanoni.com${path}`),
      environment,
    );
    assert.equal(await response.text(), id);
    assert.equal(assetRequests.at(-1).id, id);
  }
});

for (const path of [
  "/cockpit-other/",
  "/reports/",
  "/cockpit/terminal-session/attach",
]) {
  test(`preserves the upstream protocol and most-specific route for ${path}`, async () => {
    const { environment, assetRequests } = createEnvironment({
      rootService: path === "/reports/",
    });
    const originalFetch = globalThis.fetch;
    let upstreamRequest;
    globalThis.fetch = async (request) => {
      upstreamRequest = request;
      return new Response("upstream");
    };
    try {
      const response = await edgeRouterWorker.fetch(
        new Request(`https://lucaszanoni.com${path}`, {
          headers: {
            Upgrade: "websocket",
            "Cf-Access-Jwt-Assertion": "identity",
          },
        }),
        environment,
      );
      assert.equal(await response.text(), "upstream");
      assert.equal(assetRequests.length, 0);
      assert.equal(
        new URL(upstreamRequest.url).hostname,
        path.includes("terminal-session")
          ? "bridge.example.com"
          : path === "/reports/"
            ? "reports.example.run.app"
            : "shell.example.run.app",
      );
      assert.equal(upstreamRequest.headers.get("Upgrade"), "websocket");
      if (path.includes("terminal-session"))
        assert.equal(
          upstreamRequest.headers.get("Cf-Access-Jwt-Assertion"),
          "identity",
        );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
}

test("fails closed when a declared app service is absent", async () => {
  const { environment } = createEnvironment();
  delete environment.APP_COCKPIT;
  assert.equal(
    (
      await edgeRouterWorker.fetch(
        new Request("https://lucaszanoni.com/cockpit/"),
        environment,
      )
    ).status,
    503,
  );
});

test("private asset adapters reject requests outside their mount", async () => {
  const result = await staticApplicationWorker.fetch(
    new Request("https://lucaszanoni.com/public"),
    {
      APPLICATION_MOUNT_PATH: "/cockpit/",
      ASSETS: {
        fetch: () => {
          throw new Error("must not read private assets");
        },
      },
    },
  );
  assert.equal(result.status, 404);
});
