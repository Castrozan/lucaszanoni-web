import test from "node:test";
import assert from "node:assert/strict";

import {
  shellOriginHost,
  edgeSharedSecretHeaderName,
  trustedExternalOriginHost,
  untrustedExternalOriginHost,
  multiSegmentBaseExternalOriginHost,
  cloudflareAccessJwtAssertionHeaderName,
  dispatchThroughEdgeWithExternalHttps,
} from "./edge-router-test-harness.mjs";

test("a preserve external route forwards to the external origin host", async () => {
  const { capturedOriginRequest } =
    await dispatchThroughEdgeWithExternalHttps("/vendor/catalog/item");
  assert.equal(
    new URL(capturedOriginRequest.url).hostname,
    untrustedExternalOriginHost,
  );
});

test("a preserve external route keeps the request path and query untouched", async () => {
  const { capturedOriginRequest } = await dispatchThroughEdgeWithExternalHttps(
    "/vendor/catalog/item?page=2",
  );
  const forwardedOriginUrl = new URL(capturedOriginRequest.url);
  assert.equal(forwardedOriginUrl.pathname, "/vendor/catalog/item");
  assert.equal(forwardedOriginUrl.search, "?page=2");
});

test("a strip-mount-path external route rewrites the path under the forwarded base path", async () => {
  const { capturedOriginRequest } = await dispatchThroughEdgeWithExternalHttps(
    "/private/dashboard/widget?refresh=1",
  );
  const forwardedOriginUrl = new URL(capturedOriginRequest.url);
  assert.equal(forwardedOriginUrl.hostname, trustedExternalOriginHost);
  assert.equal(forwardedOriginUrl.pathname, "/dashboard/widget");
  assert.equal(forwardedOriginUrl.search, "?refresh=1");
});

test("the edge shared secret header is never injected on an external route", async () => {
  const { capturedOriginRequest } =
    await dispatchThroughEdgeWithExternalHttps("/private/dashboard");
  assert.equal(
    capturedOriginRequest.headers.get(edgeSharedSecretHeaderName),
    null,
  );
});

test("cloudflare access cookies are stripped while other cookies survive", async () => {
  const { capturedOriginRequest } = await dispatchThroughEdgeWithExternalHttps(
    "/vendor/catalog",
    {
      Cookie:
        "CF_Authorization=token; session=abc; CF_AuthorizationExtra=keep; CF_AppSession=xyz",
    },
  );
  assert.equal(
    capturedOriginRequest.headers.get("Cookie"),
    "session=abc; CF_AuthorizationExtra=keep",
  );
});

test("a trusted external origin also has its access cookies stripped", async () => {
  const { capturedOriginRequest } = await dispatchThroughEdgeWithExternalHttps(
    "/private/dashboard",
    { Cookie: "CF_Authorization=token; session=abc; CF_AppSession=xyz" },
  );
  assert.equal(capturedOriginRequest.headers.get("Cookie"), "session=abc");
});

test("the cookie header is removed entirely when only access cookies were present", async () => {
  const { capturedOriginRequest } = await dispatchThroughEdgeWithExternalHttps(
    "/vendor/catalog",
    { Cookie: "CF_Authorization=token; CF_AppSession=xyz" },
  );
  assert.equal(capturedOriginRequest.headers.get("Cookie"), null);
});

test("a trusted external origin receives the forwarded access identity assertion", async () => {
  const { capturedOriginRequest } = await dispatchThroughEdgeWithExternalHttps(
    "/private/dashboard",
    { [cloudflareAccessJwtAssertionHeaderName]: "signed-identity-jwt" },
  );
  assert.equal(
    capturedOriginRequest.headers.get(cloudflareAccessJwtAssertionHeaderName),
    "signed-identity-jwt",
  );
});

test("an untrusted external origin never receives the access identity assertion", async () => {
  const { capturedOriginRequest } = await dispatchThroughEdgeWithExternalHttps(
    "/vendor/catalog",
    { [cloudflareAccessJwtAssertionHeaderName]: "signed-identity-jwt" },
  );
  assert.equal(
    capturedOriginRequest.headers.get(cloudflareAccessJwtAssertionHeaderName),
    null,
  );
});

test("an external prefix is matched before the cloud run fallback", async () => {
  const { capturedOriginRequest } =
    await dispatchThroughEdgeWithExternalHttps("/private/anything");
  assert.equal(
    new URL(capturedOriginRequest.url).hostname,
    trustedExternalOriginHost,
  );
});

test("a path that no external prefix matches still routes to the cloud run shell with the shared secret", async () => {
  const { capturedOriginRequest } =
    await dispatchThroughEdgeWithExternalHttps("/about/contact");
  assert.equal(new URL(capturedOriginRequest.url).hostname, shellOriginHost);
  assert.notEqual(
    capturedOriginRequest.headers.get(edgeSharedSecretHeaderName),
    null,
  );
});

test("a client-supplied in-repo auth header is stripped before reaching the external origin", async () => {
  const { capturedOriginRequest } = await dispatchThroughEdgeWithExternalHttps(
    "/vendor/catalog",
    { [edgeSharedSecretHeaderName]: "attacker-probe-value" },
  );
  assert.equal(
    capturedOriginRequest.headers.get(edgeSharedSecretHeaderName),
    null,
  );
});

test("a trusted external route never mints an identity assertion the client did not send", async () => {
  const { capturedOriginRequest } =
    await dispatchThroughEdgeWithExternalHttps("/private/dashboard");
  assert.equal(
    capturedOriginRequest.headers.get(cloudflareAccessJwtAssertionHeaderName),
    null,
  );
});

test("a strip-mount-path route joins a multi-segment forwarded base path with a single separator", async () => {
  const { capturedOriginRequest } =
    await dispatchThroughEdgeWithExternalHttps("/app/foo/bar?q=1");
  const forwardedOriginUrl = new URL(capturedOriginRequest.url);
  assert.equal(
    forwardedOriginUrl.hostname,
    multiSegmentBaseExternalOriginHost,
  );
  assert.equal(forwardedOriginUrl.pathname, "/api/foo/bar");
  assert.equal(forwardedOriginUrl.search, "?q=1");
});
