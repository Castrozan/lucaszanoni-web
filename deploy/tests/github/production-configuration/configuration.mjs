import assert from "node:assert/strict";
import { test } from "node:test";
import {
  productionConfigurationFields,
  verifyProductionConfiguration,
} from "../../../github/verify-production-configuration.mjs";
import {
  accountId,
  secretValues,
  apiToken,
  createEnvironment,
  createReader,
  googleProvider,
  rejection,
  assertNoDisclosure,
} from "./fixtures.mjs";

test("maps all eight canonical fields to their named environment secrets", () => {
  assert.deepEqual(
    productionConfigurationFields.map(({ field, secretName }) => [
      field,
      secretName,
    ]),
    [
      ["cloudflare_account_id", "CLOUDFLARE_ACCOUNT_ID"],
      ["edge_shared_secret_value", "EDGE_SHARED_SECRET_VALUE"],
      ["google_sso_client_id", "GOOGLE_SSO_CLIENT_ID"],
      ["google_sso_client_secret", "GOOGLE_SSO_CLIENT_SECRET"],
      ["jarvis_session_tunnel_secret", "JARVIS_SESSION_TUNNEL_SECRET"],
      ["kira_session_tunnel_secret", "KIRA_SESSION_TUNNEL_SECRET"],
      ["rin_session_tunnel_secret", "RIN_SESSION_TUNNEL_SECRET"],
      ["owner_account_email", "OWNER_ACCOUNT_EMAIL"],
    ],
  );
});

test("accepts synthetic configuration and reads the identity providers with one GET path", async () => {
  const requests = [];
  const result = await verifyProductionConfiguration({
    environment: createEnvironment(),
    createReader: (readerAccountId, readerToken) => {
      assert.equal(readerAccountId, accountId);
      assert.equal(readerToken, apiToken);
      return createReader([googleProvider()], requests);
    },
  });
  assert.deepEqual(result, { fieldCount: 8, identityMatched: true });
  assert.deepEqual(requests, ["access/identity_providers"]);
});

test("matches the configured Google provider without restricting unrelated providers", async () => {
  const result = await verifyProductionConfiguration({
    environment: createEnvironment(),
    createReader: () =>
      createReader([
        { type: "github", config: { client_id: "other" } },
        googleProvider("unrelated-google-client-id"),
        googleProvider(),
      ]),
  });
  assert.equal(result.identityMatched, true);
});

test("rejects missing or malformed canonical JSON without a cause or snippet", async () => {
  for (const environment of [
    createEnvironment({ PRODUCTION_TERRAFORM_VARIABLES: undefined }),
    createEnvironment({ PRODUCTION_TERRAFORM_VARIABLES: "" }),
    createEnvironment({
      PRODUCTION_TERRAFORM_VARIABLES: `{"google_sso_client_secret": "${secretValues.google_sso_client_secret}"`,
    }),
    createEnvironment({ PRODUCTION_TERRAFORM_VARIABLES: "[]" }),
    createEnvironment({ PRODUCTION_TERRAFORM_VARIABLES: "null" }),
  ]) {
    const error = await rejection(
      verifyProductionConfiguration({
        environment,
        createReader: () => createReader([googleProvider()]),
      }),
    );
    assert.equal(error.message, "Production configuration JSON is invalid");
    assertNoDisclosure(error);
  }
});

test("rejects a missing, empty, non-string or mismatched field by name only", async () => {
  for (const { field, secretName } of productionConfigurationFields) {
    for (const [configurationValue, message] of [
      [undefined, `Production configuration field ${field} is missing`],
      ["", `Production configuration field ${field} is missing`],
      [7, `Production configuration field ${field} is missing`],
      [
        "synthetic-different-value",
        `Production configuration field ${field} does not match ${secretName}`,
      ],
    ]) {
      const configuration = { ...secretValues, [field]: configurationValue };
      if (configurationValue === undefined) delete configuration[field];
      const error = await rejection(
        verifyProductionConfiguration({
          environment: createEnvironment(
            {
              PRODUCTION_TERRAFORM_VARIABLES: JSON.stringify(configuration),
            },
            {},
          ),
          createReader: () => createReader([googleProvider()]),
        }),
      );
      assert.equal(error.message, message);
      assertNoDisclosure(error);
    }
  }
});

test("rejects an environment secret that is absent while the canonical field is present", async () => {
  const error = await rejection(
    verifyProductionConfiguration({
      environment: createEnvironment({ OWNER_ACCOUNT_EMAIL: undefined }),
      createReader: () => createReader([googleProvider()]),
    }),
  );
  assert.equal(
    error.message,
    "Production configuration field owner_account_email does not match OWNER_ACCOUNT_EMAIL",
  );
  assertNoDisclosure(error);
});

test("rejects an invalid Cloudflare account identifier before any request", async () => {
  const invalidAccount = "not-a-32-hex-account/../identity";
  let created = false;
  const error = await rejection(
    verifyProductionConfiguration({
      environment: createEnvironment(
        { CLOUDFLARE_ACCOUNT_ID: invalidAccount },
        { cloudflare_account_id: invalidAccount },
      ),
      createReader: () => {
        created = true;
        return createReader([googleProvider()]);
      },
    }),
  );
  assert.equal(error.message, "Cloudflare account identifier is invalid");
  assert.equal(created, false);
  assertNoDisclosure(error);
});
