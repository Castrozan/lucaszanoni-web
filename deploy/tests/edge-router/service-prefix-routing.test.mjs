import test from "node:test";
import assert from "node:assert/strict";

import {
  shellServiceBinding,
  usageServiceBinding,
  reportsServiceBinding,
  edgeSharedSecretHeaderName,
} from "./edge-router-test-constants.mjs";
import { dispatchThroughEdge } from "./edge-router-test-dispatch.mjs";

for (const [requestPath, expectedBinding] of [
  ["/", shellServiceBinding],
  ["/about/contact", shellServiceBinding],
  ["/engineering/dotfiles/claude/usage/some/spa/route", usageServiceBinding],
  ["/reports/quality", reportsServiceBinding],
  ["/reports", reportsServiceBinding],
  ["/reportsxyz", shellServiceBinding],
]) {
  test(`${requestPath} is served by the ${expectedBinding} service`, async () => {
    const { servingBinding } = await dispatchThroughEdge(requestPath);
    assert.equal(servingBinding, expectedBinding);
  });
}

test("the request url reaches the service untouched", async () => {
  const { capturedOriginRequest } = await dispatchThroughEdge(
    "/reports/baseline/index.html?refresh=1",
  );
  assert.equal(
    capturedOriginRequest.url,
    "https://lucaszanoni.com.br/reports/baseline/index.html?refresh=1",
  );
});

test("a service request carries the client headers and never the edge shared secret", async () => {
  const { capturedOriginRequest } = await dispatchThroughEdge("/reports/", {
    "x-incoming-marker": "present",
  });
  assert.equal(
    capturedOriginRequest.headers.get("x-incoming-marker"),
    "present",
  );
  assert.equal(
    capturedOriginRequest.headers.get(edgeSharedSecretHeaderName),
    null,
  );
});

test("the service response is returned to the client unchanged", async () => {
  const { edgeResponse } = await dispatchThroughEdge("/");
  assert.equal(edgeResponse.status, 200);
  assert.equal(await edgeResponse.text(), "service-response-body");
});

test("a routing table without any service prefix answers 503", async () => {
  const { edgeResponse } = await dispatchThroughEdge(
    "/",
    {},
    {
      EDGE_ROUTES: JSON.stringify({ workerServicePrefixes: [] }),
      EDGE_SHARED_SECRET_HEADER_NAME: edgeSharedSecretHeaderName,
    },
  );
  assert.equal(edgeResponse.status, 503);
});
