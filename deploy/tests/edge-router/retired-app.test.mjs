import test from "node:test";
import assert from "node:assert/strict";

import {
  shellServiceBinding,
  reportsServiceBinding,
  retiredApplicationMountPrefix,
} from "./edge-router-test-constants.mjs";
import { dispatchThroughEdgeWithRetired } from "./edge-router-test-dispatch.mjs";

test("a request to a retired application mount returns 410 Gone", async () => {
  const { edgeResponse } = await dispatchThroughEdgeWithRetired(
    retiredApplicationMountPrefix,
  );
  assert.equal(edgeResponse.status, 410);
});

test("a deep path under a retired application mount returns 410 Gone", async () => {
  const { edgeResponse } = await dispatchThroughEdgeWithRetired(
    `${retiredApplicationMountPrefix}some/deep/client/route`,
  );
  assert.equal(edgeResponse.status, 410);
});

test("a retired application mount is never forwarded to any origin", async () => {
  const { capturedOriginRequest } = await dispatchThroughEdgeWithRetired(
    retiredApplicationMountPrefix,
  );
  assert.equal(capturedOriginRequest, undefined);
});

test("an active prefix still routes to its service alongside a retired mount", async () => {
  const { servingBinding } = await dispatchThroughEdgeWithRetired("/reports/");
  assert.equal(servingBinding, reportsServiceBinding);
});

test("the shell root still routes to the shell service alongside a retired mount", async () => {
  const { servingBinding } = await dispatchThroughEdgeWithRetired("/");
  assert.equal(servingBinding, shellServiceBinding);
});
