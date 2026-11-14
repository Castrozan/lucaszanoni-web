import test from "node:test";
import assert from "node:assert/strict";

import {
  shellServiceBinding,
  reportsServiceBinding,
  edgeSharedSecretHeaderName,
  cloudflareAccessJwtAssertionHeaderName,
  subdomainUntrustedExternalServingHost,
  subdomainTrustedExternalServingHost,
  untrustedExternalOriginHost,
  trustedExternalOriginHost,
} from "./edge-router-test-constants.mjs";
import {
  dispatchThroughEdgeFromSubdomainHost,
  dispatchThroughEdgeApexWithSubdomains,
} from "./edge-router-test-dispatch.mjs";

test("an external subdomain forwards the request path and query untouched", async () => {
  const { capturedOriginRequest } = await dispatchThroughEdgeFromSubdomainHost(
    subdomainTrustedExternalServingHost,
    "/dashboard/widget?refresh=1",
  );
  const forwardedOriginUrl = new URL(capturedOriginRequest.url);
  assert.equal(forwardedOriginUrl.pathname, "/dashboard/widget");
  assert.equal(forwardedOriginUrl.search, "?refresh=1");
});

test("an external subdomain host routes to its own external origin", async () => {
  const { capturedOriginRequest } = await dispatchThroughEdgeFromSubdomainHost(
    subdomainUntrustedExternalServingHost,
    "/catalog/item",
  );
  assert.equal(
    new URL(capturedOriginRequest.url).hostname,
    untrustedExternalOriginHost,
  );
});

test("an external subdomain never has the edge shared secret injected", async () => {
  const { capturedOriginRequest } = await dispatchThroughEdgeFromSubdomainHost(
    subdomainUntrustedExternalServingHost,
    "/catalog",
  );
  assert.equal(
    capturedOriginRequest.headers.get(edgeSharedSecretHeaderName),
    null,
  );
});

test("a client-supplied edge auth header is stripped before reaching an external subdomain", async () => {
  const { capturedOriginRequest } = await dispatchThroughEdgeFromSubdomainHost(
    subdomainUntrustedExternalServingHost,
    "/catalog",
    { [edgeSharedSecretHeaderName]: "attacker-probe-value" },
  );
  assert.equal(
    capturedOriginRequest.headers.get(edgeSharedSecretHeaderName),
    null,
  );
});

test("apex cloudflare access cookies never reach a subdomain origin while other cookies survive", async () => {
  const { capturedOriginRequest } = await dispatchThroughEdgeFromSubdomainHost(
    subdomainTrustedExternalServingHost,
    "/dashboard",
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

test("the cookie header is removed entirely when only apex access cookies were present", async () => {
  const { capturedOriginRequest } = await dispatchThroughEdgeFromSubdomainHost(
    subdomainUntrustedExternalServingHost,
    "/catalog",
    { Cookie: "CF_Authorization=token; CF_AppSession=xyz" },
  );
  assert.equal(capturedOriginRequest.headers.get("Cookie"), null);
});

test("an untrusted external subdomain never receives the access identity assertion", async () => {
  const { capturedOriginRequest } = await dispatchThroughEdgeFromSubdomainHost(
    subdomainUntrustedExternalServingHost,
    "/catalog",
    { [cloudflareAccessJwtAssertionHeaderName]: "signed-identity-jwt" },
  );
  assert.equal(
    capturedOriginRequest.headers.get(cloudflareAccessJwtAssertionHeaderName),
    null,
  );
});

test("a trusted external subdomain receives the forwarded access identity assertion", async () => {
  const { capturedOriginRequest } = await dispatchThroughEdgeFromSubdomainHost(
    subdomainTrustedExternalServingHost,
    "/catalog",
    { [cloudflareAccessJwtAssertionHeaderName]: "signed-identity-jwt" },
  );
  assert.equal(
    capturedOriginRequest.headers.get(cloudflareAccessJwtAssertionHeaderName),
    "signed-identity-jwt",
  );
  assert.equal(
    new URL(capturedOriginRequest.url).hostname,
    trustedExternalOriginHost,
  );
});

test("a subdomain host bypasses apex path-prefix matching entirely", async () => {
  const { capturedOriginRequest, servingBinding } =
    await dispatchThroughEdgeFromSubdomainHost(
      subdomainTrustedExternalServingHost,
      "/reports/quality",
    );
  assert.equal(
    new URL(capturedOriginRequest.url).hostname,
    trustedExternalOriginHost,
  );
  assert.equal(servingBinding, undefined);
});

test("apex path-prefix routing is unchanged when subdomains are configured", async () => {
  const { servingBinding } =
    await dispatchThroughEdgeApexWithSubdomains("/reports/quality");
  assert.equal(servingBinding, reportsServiceBinding);
});

test("the apex root still routes to the shell when subdomains are configured", async () => {
  const { servingBinding } = await dispatchThroughEdgeApexWithSubdomains("/");
  assert.equal(servingBinding, shellServiceBinding);
});

test("the origin response is returned to the client unchanged from a subdomain route", async () => {
  const { edgeResponse } = await dispatchThroughEdgeFromSubdomainHost(
    subdomainUntrustedExternalServingHost,
    "/dashboard",
  );
  assert.equal(edgeResponse.status, 200);
  assert.equal(await edgeResponse.text(), "origin-response-body");
});
