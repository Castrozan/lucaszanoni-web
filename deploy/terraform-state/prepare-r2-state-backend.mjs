import { createHash } from "node:crypto";
import { appendFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { CloudflareApiError, createCloudflareApi } from "./cloudflare-api.mjs";

const R2_NOT_ENABLED_ERROR_CODE = 10042;

export class StateBackendHardStop extends Error {}

async function readApiTokenIdentifier(cloudflareApi, accountId) {
  for (const path of [
    "user/tokens/verify",
    `accounts/${accountId}/tokens/verify`,
  ]) {
    try {
      const verification = await cloudflareApi.get(path);
      if (verification?.status === "active" && verification.id) {
        return verification.id;
      }
    } catch (error) {
      if (!(error instanceof CloudflareApiError)) throw error;
    }
  }
  throw new StateBackendHardStop(
    "The Cloudflare API token could not be verified as an active user or account token",
  );
}

export function deriveR2Credentials(apiTokenIdentifier, apiToken, accountId) {
  return {
    accessKeyIdentifier: apiTokenIdentifier,
    secretAccessKey: createHash("sha256").update(apiToken).digest("hex"),
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  };
}

async function listStateBuckets(cloudflareApi, accountId, bucketName) {
  try {
    const listing = await cloudflareApi.get(
      `accounts/${accountId}/r2/buckets?name_contains=${encodeURIComponent(bucketName)}`,
    );
    return listing?.buckets ?? [];
  } catch (error) {
    if (!(error instanceof CloudflareApiError)) throw error;
    const reason = error.errorCodes.includes(R2_NOT_ENABLED_ERROR_CODE)
      ? "R2 is not enabled on the Cloudflare account"
      : "The Cloudflare API token cannot read R2 buckets";
    throw new StateBackendHardStop(`${reason}: ${error.message}`);
  }
}

export async function prepareR2StateBackend({
  cloudflareApi,
  apiToken,
  accountId,
  bucketName,
}) {
  const apiTokenIdentifier = await readApiTokenIdentifier(
    cloudflareApi,
    accountId,
  );
  const credentials = deriveR2Credentials(
    apiTokenIdentifier,
    apiToken,
    accountId,
  );
  const buckets = await listStateBuckets(cloudflareApi, accountId, bucketName);
  if (buckets.some((bucket) => bucket.name === bucketName)) {
    return { credentials, bucketCreated: false };
  }
  try {
    await cloudflareApi.post(`accounts/${accountId}/r2/buckets`, {
      name: bucketName,
    });
  } catch (error) {
    if (!(error instanceof CloudflareApiError)) throw error;
    throw new StateBackendHardStop(
      `The Cloudflare API token cannot create the R2 state bucket: ${error.message}`,
    );
  }
  return { credentials, bucketCreated: true };
}

function exportToGithubEnvironment(credentials, githubEnvironmentPath) {
  for (const value of Object.values(credentials)) {
    console.log(`::add-mask::${value}`);
  }
  appendFileSync(
    githubEnvironmentPath,
    [
      `AWS_ACCESS_KEY_ID=${credentials.accessKeyIdentifier}`,
      `AWS_SECRET_ACCESS_KEY=${credentials.secretAccessKey}`,
      `AWS_ENDPOINT_URL_S3=${credentials.endpoint}`,
      "",
    ].join("\n"),
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [bucketName] = process.argv.slice(2);
  const { CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, GITHUB_ENV } =
    process.env;
  try {
    if (!bucketName || !CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ACCOUNT_ID) {
      throw new Error(
        "Usage: CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID set, bucket name as argument",
      );
    }
    const { credentials, bucketCreated } = await prepareR2StateBackend({
      cloudflareApi: createCloudflareApi(CLOUDFLARE_API_TOKEN),
      apiToken: CLOUDFLARE_API_TOKEN,
      accountId: CLOUDFLARE_ACCOUNT_ID,
      bucketName,
    });
    exportToGithubEnvironment(credentials, GITHUB_ENV);
    console.log(
      `R2 probe passed; state bucket ${bucketName} ${bucketCreated ? "created" : "already exists"}`,
    );
  } catch (error) {
    const prefix =
      error instanceof StateBackendHardStop ? "HARD STOP: " : "ERROR: ";
    console.error(`${prefix}${error.message}`);
    process.exitCode = 1;
  }
}
