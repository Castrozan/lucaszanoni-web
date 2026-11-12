import assert from "node:assert/strict";
import { test } from "node:test";
import { verifyProductionConfiguration } from "../../../github/verify-production-configuration.mjs";
import {
  accountId,
  secretValues,
  createEnvironment,
  createReader,
  googleProvider,
  rejection,
  assertNoDisclosure,
} from "./fixtures.mjs";

test("rejects a missing, duplicated or mismatched google identity provider", async () => {
  const cases = [
    [[], "Cloudflare Access must contain exactly one google identity provider"],
    [
      [{ type: "github", config: { client_id: "x" } }],
      "Cloudflare Access must contain exactly one google identity provider",
    ],
    [
      [googleProvider(), googleProvider()],
      "Cloudflare Access must contain exactly one google identity provider",
    ],
    [
      [googleProvider("synthetic-other-client-id")],
      "Cloudflare Access google identity provider does not match production configuration",
    ],
    [
      [{ type: "google", config: {} }],
      "Cloudflare Access google identity provider does not match production configuration",
    ],
  ];
  for (const [providers, message] of cases) {
    const error = await rejection(
      verifyProductionConfiguration({
        environment: createEnvironment(),
        createReader: () => createReader(providers),
      }),
    );
    assert.equal(error.message, message);
    assertNoDisclosure(error);
  }
});

test("rejects a non-array identity provider result", async () => {
  const error = await rejection(
    verifyProductionConfiguration({
      environment: createEnvironment(),
      createReader: () => createReader({ type: "google" }),
    }),
  );
  assert.equal(
    error.message,
    "Cloudflare Access must contain exactly one google identity provider",
  );
});

test("requires the Cloudflare API token", async () => {
  const error = await rejection(
    verifyProductionConfiguration({
      environment: createEnvironment({ CLOUDFLARE_API_TOKEN: "" }),
      createReader: () => createReader([googleProvider()]),
    }),
  );
  assert.equal(error.message, "CLOUDFLARE_API_TOKEN is required");
});

test("surfaces an HTTP failure through a GET-only request without disclosing the response body", async (context) => {
  const requests = [];
  context.mock.method(globalThis, "fetch", async (url, options = {}) => {
    requests.push({ url: String(url), method: options.method ?? "GET" });
    return new Response(
      JSON.stringify({
        errors: [{ message: secretValues.google_sso_client_secret }],
      }),
      { status: 403 },
    );
  });
  const error = await rejection(
    verifyProductionConfiguration({ environment: createEnvironment() }),
  );
  assert.equal(error.message, "Cloudflare read failed: HTTP 403");
  assertNoDisclosure(error);
  assert.deepEqual(requests, [
    {
      url: `https://api.cloudflare.com/client/v4/accounts/${accountId}/access/identity_providers`,
      method: "GET",
    },
  ]);
});

test("reports an unreadable response body generically without echoing it", async (context) => {
  context.mock.method(
    globalThis,
    "fetch",
    async () =>
      new Response(`<html>${secretValues.google_sso_client_secret}</html>`, {
        status: 200,
      }),
  );
  const error = await rejection(
    verifyProductionConfiguration({ environment: createEnvironment() }),
  );
  assert.equal(
    error.message,
    "Cloudflare Access identity provider read failed",
  );
  assertNoDisclosure(error);
});

test("importing the module does not run the command line entrypoint", async () => {
  const module =
    await import("../../../github/verify-production-configuration.mjs?import-only");
  assert.equal(typeof module.verifyProductionConfiguration, "function");
});
