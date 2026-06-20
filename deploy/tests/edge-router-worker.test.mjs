import test from "node:test";
import assert from "node:assert/strict";

import edgeRouterWorker from "../../infra/modules/cloudflare-edge/edge-router-worker.mjs";

const shellOriginHost = "lucaszanoni-shell.example.run.app";
const usageOriginHost = "lucaszanoni-usage-dashboard.example.run.app";
const reportsOriginHost = "lucaszanoni-reports.example.run.app";
const edgeSharedSecretHeaderName = "X-Edge-Auth";
const edgeSharedSecretValue = "edge-router-test-secret-2f6a9c";

const edgeEnvironment = {
  EDGE_ROUTES: JSON.stringify({
    shell: shellOriginHost,
    prefixes: [
      {
        prefix: "/engineering/dotfiles/claude/usage/",
        host: usageOriginHost,
      },
      {
        prefix: "/reports/",
        host: reportsOriginHost,
      },
    ],
  }),
  EDGE_SHARED_SECRET_HEADER_NAME: edgeSharedSecretHeaderName,
  EDGE_SHARED_SECRET: edgeSharedSecretValue,
};

const dispatchThroughEdge = async (
  requestPathAndQuery,
  incomingHeaders = {},
) => {
  let capturedOriginRequest;
  const originalGlobalFetch = globalThis.fetch;
  globalThis.fetch = async (originRequest) => {
    capturedOriginRequest = originRequest;
    return new Response("origin-response-body", { status: 200 });
  };
  try {
    const edgeResponse = await edgeRouterWorker.fetch(
      new Request(`https://lucaszanoni.com.br${requestPathAndQuery}`, {
        headers: incomingHeaders,
      }),
      edgeEnvironment,
    );
    return { capturedOriginRequest, edgeResponse };
  } finally {
    globalThis.fetch = originalGlobalFetch;
  }
};

test("root path routes to the shell origin", async () => {
  const { capturedOriginRequest } = await dispatchThroughEdge("/");
  assert.equal(new URL(capturedOriginRequest.url).hostname, shellOriginHost);
});

test("an unmatched path falls back to the shell origin", async () => {
  const { capturedOriginRequest } = await dispatchThroughEdge("/about/contact");
  assert.equal(new URL(capturedOriginRequest.url).hostname, shellOriginHost);
});

test("the usage prefix routes to the usage dashboard origin", async () => {
  const { capturedOriginRequest } = await dispatchThroughEdge(
    "/engineering/dotfiles/claude/usage/some/spa/route",
  );
  assert.equal(new URL(capturedOriginRequest.url).hostname, usageOriginHost);
});

test("the reports prefix routes to the reports origin", async () => {
  const { capturedOriginRequest } =
    await dispatchThroughEdge("/reports/quality");
  assert.equal(new URL(capturedOriginRequest.url).hostname, reportsOriginHost);
});

test("a prefix without its trailing slash falls back to the shell origin", async () => {
  const { capturedOriginRequest } = await dispatchThroughEdge("/reports");
  assert.equal(new URL(capturedOriginRequest.url).hostname, shellOriginHost);
});

test("the request path and query string are forwarded untouched", async () => {
  const { capturedOriginRequest } = await dispatchThroughEdge(
    "/reports/baseline/index.html?refresh=1",
  );
  const forwardedOriginUrl = new URL(capturedOriginRequest.url);
  assert.equal(forwardedOriginUrl.pathname, "/reports/baseline/index.html");
  assert.equal(forwardedOriginUrl.search, "?refresh=1");
});

test("the edge shared secret header is injected on the origin request", async () => {
  const { capturedOriginRequest } = await dispatchThroughEdge("/reports/");
  assert.equal(
    capturedOriginRequest.headers.get(edgeSharedSecretHeaderName),
    edgeSharedSecretValue,
  );
});

test("incoming request headers are preserved on the origin request", async () => {
  const { capturedOriginRequest } = await dispatchThroughEdge("/reports/", {
    "x-incoming-marker": "present",
  });
  assert.equal(
    capturedOriginRequest.headers.get("x-incoming-marker"),
    "present",
  );
});

test("the origin response is returned to the client unchanged", async () => {
  const { edgeResponse } = await dispatchThroughEdge("/");
  assert.equal(edgeResponse.status, 200);
  assert.equal(await edgeResponse.text(), "origin-response-body");
});
