import assert from "node:assert/strict";
import { test } from "node:test";
import edgeRouterWorker from "../../../infra/modules/cloudflare-edge/edge-router-worker.mjs";

function createEnvironment() {
  const assetRequests = [];
  return {
    assetRequests,
    environment: {
      EDGE_ROUTES: JSON.stringify({
        shell: "shell.example.run.app",
        prefixes: [{ prefix: "/cockpit/", host: "old.example.run.app" }],
        workerAssetsPrefixes: [{ prefix: "/cockpit/" }],
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
      ASSETS: {
        async fetch(request) {
          assetRequests.push(request);
          return new Response("static-asset");
        },
      },
    },
  };
}

for (const path of [
  "/cockpit/",
  "/cockpit/dashboard",
  "/cockpit/assets/app.js?v=1",
]) {
  test(`serves ${path} from the asset binding instead of Cloud Run`, async () => {
    const { environment, assetRequests } = createEnvironment();
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response("obsolete-cloud-run");
    try {
      const response = await edgeRouterWorker.fetch(
        new Request(`https://lucaszanoni.com${path}`),
        environment,
      );
      assert.equal(await response.text(), "static-asset");
      const assetUrl = new URL(assetRequests[0].url);
      assert.equal(
        assetUrl.pathname + assetUrl.search,
        path === "/cockpit/" ? "/index.html" : path.slice("/cockpit".length),
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
}

test("redirects the mount without a trailing slash while preserving its query", async () => {
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

for (const path of ["/cockpit-other/", "/cockpit/terminal-session/attach"]) {
  test(`preserves the existing upstream route for ${path}`, async () => {
    const { environment, assetRequests } = createEnvironment();
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
