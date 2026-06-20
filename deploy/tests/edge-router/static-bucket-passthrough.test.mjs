import test from "node:test";
import assert from "node:assert/strict";

import {
  reportsOriginHost,
  reportsStaticBucketName,
  edgeSharedSecretHeaderName,
  edgeSharedSecretValue,
  dispatchThroughEdgeWithStaticBuckets,
} from "./edge-router-test-harness.mjs";

test("the reports baseline prefix routes to the public GCS bucket origin", async () => {
  const { capturedOriginRequest } =
    await dispatchThroughEdgeWithStaticBuckets("/reports/baseline/");
  assert.equal(
    new URL(capturedOriginRequest.url).hostname,
    "storage.googleapis.com",
  );
});

test("the reports baseline root resolves to the bucket index.html object", async () => {
  const { capturedOriginRequest } =
    await dispatchThroughEdgeWithStaticBuckets("/reports/baseline/");
  assert.equal(
    new URL(capturedOriginRequest.url).pathname,
    `/${reportsStaticBucketName}/reports/baseline/index.html`,
  );
});

test("a nested reports baseline asset maps to its bucket object key", async () => {
  const { capturedOriginRequest } = await dispatchThroughEdgeWithStaticBuckets(
    "/reports/baseline/assets/app.css",
  );
  assert.equal(
    new URL(capturedOriginRequest.url).pathname,
    `/${reportsStaticBucketName}/reports/baseline/assets/app.css`,
  );
});

test("the reports coverage prefix resolves to the bucket coverage index", async () => {
  const { capturedOriginRequest } =
    await dispatchThroughEdgeWithStaticBuckets("/reports/coverage/");
  assert.equal(
    new URL(capturedOriginRequest.url).pathname,
    `/${reportsStaticBucketName}/reports/coverage/index.html`,
  );
});

test("a static bucket request omits the shared secret header", async () => {
  const { capturedOriginRequest } =
    await dispatchThroughEdgeWithStaticBuckets("/reports/coverage/");
  assert.equal(
    capturedOriginRequest.headers.get(edgeSharedSecretHeaderName),
    null,
  );
});

test("the reports SPA root still routes to the reports Cloud Run origin with the secret header", async () => {
  const { capturedOriginRequest } =
    await dispatchThroughEdgeWithStaticBuckets("/reports/");
  assert.equal(new URL(capturedOriginRequest.url).hostname, reportsOriginHost);
  assert.equal(
    capturedOriginRequest.headers.get(edgeSharedSecretHeaderName),
    edgeSharedSecretValue,
  );
});

test("a reports baseline path without its trailing slash falls back to the reports SPA origin", async () => {
  const { capturedOriginRequest } =
    await dispatchThroughEdgeWithStaticBuckets("/reports/baseline");
  assert.equal(new URL(capturedOriginRequest.url).hostname, reportsOriginHost);
});

test("a static bucket request preserves the query string", async () => {
  const { capturedOriginRequest } = await dispatchThroughEdgeWithStaticBuckets(
    "/reports/coverage/index.html?refresh=1",
  );
  const forwardedOriginUrl = new URL(capturedOriginRequest.url);
  assert.equal(
    forwardedOriginUrl.pathname,
    `/${reportsStaticBucketName}/reports/coverage/index.html`,
  );
  assert.equal(forwardedOriginUrl.search, "?refresh=1");
});
