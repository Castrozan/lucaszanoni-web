import { fileURLToPath } from "node:url";
import { createCloudflareReader } from "../cloudflare/cloudflare-client.mjs";

export const productionConfigurationFields = [
  { field: "cloudflare_account_id", secretName: "CLOUDFLARE_ACCOUNT_ID" },
  {
    field: "edge_shared_secret_value",
    secretName: "EDGE_SHARED_SECRET_VALUE",
  },
  { field: "google_sso_client_id", secretName: "GOOGLE_SSO_CLIENT_ID" },
  {
    field: "google_sso_client_secret",
    secretName: "GOOGLE_SSO_CLIENT_SECRET",
  },
  {
    field: "jarvis_session_tunnel_secret",
    secretName: "JARVIS_SESSION_TUNNEL_SECRET",
  },
  {
    field: "kira_session_tunnel_secret",
    secretName: "KIRA_SESSION_TUNNEL_SECRET",
  },
  {
    field: "rin_session_tunnel_secret",
    secretName: "RIN_SESSION_TUNNEL_SECRET",
  },
  { field: "owner_account_email", secretName: "OWNER_ACCOUNT_EMAIL" },
];

const CLOUDFLARE_ACCOUNT_IDENTIFIER = /^[0-9a-f]{32}$/i;

function parseCanonicalConfiguration(serialized) {
  let parsed;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    throw new Error("Production configuration JSON is invalid");
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Production configuration JSON is invalid");
  }
  return parsed;
}

function assertFieldsMatchEnvironmentSecrets(configuration, environment) {
  for (const { field, secretName } of productionConfigurationFields) {
    const value = configuration[field];
    if (typeof value !== "string" || value.length === 0) {
      throw new Error(`Production configuration field ${field} is missing`);
    }
    if (environment[secretName] !== value) {
      throw new Error(
        `Production configuration field ${field} does not match ${secretName}`,
      );
    }
  }
}

function assertGoogleIdentityProviderMatches(providers, googleClientId) {
  const googleProviders = Array.isArray(providers)
    ? providers.filter((provider) => provider?.type === "google")
    : [];
  const matchingProviders = googleProviders.filter(
    (provider) => provider.config?.client_id === googleClientId,
  );
  if (googleProviders.length === 0 || matchingProviders.length > 1) {
    throw new Error(
      "Cloudflare Access must contain exactly one google identity provider",
    );
  }
  if (matchingProviders.length === 0) {
    throw new Error(
      "Cloudflare Access google identity provider does not match production configuration",
    );
  }
}

const SAFE_CLOUDFLARE_READ_FAILURE =
  /^Cloudflare read (?:failed: HTTP \d{3}|was rejected)$/;

async function readIdentityProviders(readCloudflare) {
  try {
    return await readCloudflare("access/identity_providers");
  } catch (error) {
    throw new Error(
      SAFE_CLOUDFLARE_READ_FAILURE.test(error?.message)
        ? error.message
        : "Cloudflare Access identity provider read failed",
    );
  }
}

export async function verifyProductionConfiguration({
  environment,
  createReader = createCloudflareReader,
}) {
  const configuration = parseCanonicalConfiguration(
    environment.PRODUCTION_TERRAFORM_VARIABLES ?? "",
  );
  assertFieldsMatchEnvironmentSecrets(configuration, environment);
  if (
    !CLOUDFLARE_ACCOUNT_IDENTIFIER.test(configuration.cloudflare_account_id)
  ) {
    throw new Error("Cloudflare account identifier is invalid");
  }
  if (!environment.CLOUDFLARE_API_TOKEN) {
    throw new Error("CLOUDFLARE_API_TOKEN is required");
  }
  const readCloudflare = createReader(
    configuration.cloudflare_account_id,
    environment.CLOUDFLARE_API_TOKEN,
  );
  const providers = await readIdentityProviders(readCloudflare);
  assertGoogleIdentityProviderMatches(
    providers,
    configuration.google_sso_client_id,
  );
  return {
    fieldCount: productionConfigurationFields.length,
    identityMatched: true,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const result = await verifyProductionConfiguration({
      environment: process.env,
    });
    console.log(
      `Verified ${result.fieldCount} production configuration fields; Cloudflare Access Google identity matches`,
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
