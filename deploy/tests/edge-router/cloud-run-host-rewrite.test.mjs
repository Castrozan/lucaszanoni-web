import test from "node:test";
import assert from "node:assert/strict";

import {
  shellOriginHost,
  usageOriginHost,
  reportsOriginHost,
  edgeSharedSecretHeaderName,
  edgeSharedSecretValue,
} from "./edge-router-test-constants.mjs";
import { dispatchThroughEdge } from "./edge-router-test-dispatch.mjs";

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

test("the bare mount path without its trailing slash routes to the app origin", async () => {
  const { capturedOriginRequest } = await dispatchThroughEdge("/reports");
  assert.equal(new URL(capturedOriginRequest.url).hostname, reportsOriginHost);
});

test("a path that only shares a prefix segment still falls back to the shell origin", async () => {
  const { capturedOriginRequest } = await dispatchThroughEdge("/reportsxyz");
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
