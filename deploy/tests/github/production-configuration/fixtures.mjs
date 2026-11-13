import assert from "node:assert/strict";
import { productionConfigurationFields } from "../../../github/verify-production-configuration.mjs";

const accountId = "0123456789abcdef0123456789abcdef";
const secretValues = {
  cloudflare_account_id: accountId,
  edge_shared_secret_value: "synthetic-edge-secret-4d1f",
  google_sso_client_id: "synthetic-client-id.apps.example.test",
  google_sso_client_secret: "synthetic-client-secret-77aa",
  jarvis_session_tunnel_secret: "synthetic-jarvis-secret-12bc",
  kira_session_tunnel_secret: "synthetic-kira-secret-90de",
  rin_session_tunnel_secret: "synthetic-rin-secret-55fa",
  owner_account_email: "owner-synthetic@example.test",
};
const apiToken = "synthetic-cloudflare-token-c0ffee";

function createEnvironment(overrides = {}, configurationOverrides = {}) {
  const environment = {
    PRODUCTION_TERRAFORM_VARIABLES: JSON.stringify({
      ...secretValues,
      ...configurationOverrides,
    }),
    CLOUDFLARE_API_TOKEN: apiToken,
  };
  for (const { field, secretName } of productionConfigurationFields) {
    environment[secretName] = secretValues[field];
  }
  return { ...environment, ...overrides };
}

function createReader(providers, requests = []) {
  return async (path) => {
    requests.push(path);
    return providers;
  };
}

const googleProvider = (clientId = secretValues.google_sso_client_id) => ({
  type: "google",
  config: { client_id: clientId },
});

const allFixtureSecrets = [...Object.values(secretValues), apiToken];

async function rejection(promise) {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  assert.fail("expected the verification to reject");
}

function assertNoDisclosure(error) {
  const rendered = `${error.message}\n${error.stack}\n${String(error.cause ?? "")}`;
  for (const secret of allFixtureSecrets) {
    assert.equal(rendered.includes(secret), false, "error disclosed a secret");
  }
  assert.equal(error.cause, undefined);
}

export {
  accountId,
  secretValues,
  apiToken,
  createEnvironment,
  createReader,
  googleProvider,
  rejection,
  assertNoDisclosure,
};
