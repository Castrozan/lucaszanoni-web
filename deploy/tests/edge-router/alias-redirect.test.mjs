import test from "node:test";
import assert from "node:assert/strict";

import {
  shellOriginHost,
  aliasRedirectCanonicalHost,
  aliasRedirectStatusCode,
  edgeEnvironmentWithAliasRedirect,
  dispatchThroughEdge,
  dispatchThroughEdgeFromHost,
} from "./edge-router-test-harness.mjs";

test("an alias-host request is permanently redirected to the canonical host", async () => {
  const { edgeResponse } = await dispatchThroughEdge(
    "/",
    {},
    edgeEnvironmentWithAliasRedirect,
  );
  assert.equal(edgeResponse.status, aliasRedirectStatusCode);
  assert.equal(
    edgeResponse.headers.get("location"),
    `https://${aliasRedirectCanonicalHost}/`,
  );
});

test("the alias redirect preserves the request path and query string", async () => {
  const { edgeResponse } = await dispatchThroughEdge(
    "/reports/baseline/index.html?refresh=1",
    {},
    edgeEnvironmentWithAliasRedirect,
  );
  assert.equal(edgeResponse.status, aliasRedirectStatusCode);
  assert.equal(
    edgeResponse.headers.get("location"),
    `https://${aliasRedirectCanonicalHost}/reports/baseline/index.html?refresh=1`,
  );
});

test("the alias redirect answers at the edge without forwarding to any origin", async () => {
  const { capturedOriginRequest } = await dispatchThroughEdge(
    "/",
    {},
    edgeEnvironmentWithAliasRedirect,
  );
  assert.equal(capturedOriginRequest, undefined);
});

test("a request already on the canonical host is served by the origin, not redirected", async () => {
  const { capturedOriginRequest, edgeResponse } =
    await dispatchThroughEdgeFromHost(
      aliasRedirectCanonicalHost,
      "/",
      {},
      edgeEnvironmentWithAliasRedirect,
    );
  assert.equal(edgeResponse.status, 200);
  assert.equal(new URL(capturedOriginRequest.url).hostname, shellOriginHost);
});

test("a routing table without an alias redirect serves the origin normally", async () => {
  const { capturedOriginRequest, edgeResponse } = await dispatchThroughEdge("/");
  assert.equal(edgeResponse.status, 200);
  assert.equal(new URL(capturedOriginRequest.url).hostname, shellOriginHost);
});
