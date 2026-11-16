import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { CloudflareApiError } from "../../terraform-state/cloudflare-api.mjs";
import {
  StateBackendHardStop,
  prepareR2StateBackend,
} from "../../terraform-state/prepare-r2-state-backend.mjs";

const accountId = "0123456789abcdef0123456789abcdef";
const apiToken = "synthetic-api-token-value";
const bucketName = "synthetic-state-bucket";

function createFakeCloudflareApi({ buckets = [], failures = {} } = {}) {
  const calls = [];
  const respond = (method, path, result) => {
    calls.push(`${method} ${path}`);
    const failure = Object.entries(failures).find(([prefix]) =>
      `${method} ${path}`.startsWith(prefix),
    );
    if (failure) throw failure[1];
    return result;
  };
  return {
    calls,
    get: async (path) =>
      path.endsWith("tokens/verify")
        ? respond("GET", path, { id: "synthetic-token-id", status: "active" })
        : respond("GET", path, { buckets }),
    post: async (path, body) => respond("POST", path, body),
  };
}

test("derives R2 credentials from the API token id and the SHA-256 of its value", async () => {
  const cloudflareApi = createFakeCloudflareApi({
    buckets: [{ name: bucketName }],
  });
  const { credentials, bucketCreated } = await prepareR2StateBackend({
    cloudflareApi,
    apiToken,
    accountId,
    bucketName,
  });
  assert.deepEqual(credentials, {
    accessKeyIdentifier: "synthetic-token-id",
    secretAccessKey: createHash("sha256").update(apiToken).digest("hex"),
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  });
  assert.equal(bucketCreated, false);
  assert.ok(!cloudflareApi.calls.some((call) => call.startsWith("POST")));
});

test("creates the state bucket only when the probe finds it missing", async () => {
  const cloudflareApi = createFakeCloudflareApi({
    buckets: [{ name: `${bucketName}-other` }],
  });
  const { bucketCreated } = await prepareR2StateBackend({
    cloudflareApi,
    apiToken,
    accountId,
    bucketName,
  });
  assert.equal(bucketCreated, true);
  assert.ok(
    cloudflareApi.calls.includes(`POST accounts/${accountId}/r2/buckets`),
  );
});

test("falls back to account token verification when the user endpoint rejects the token", async () => {
  const cloudflareApi = createFakeCloudflareApi({
    buckets: [{ name: bucketName }],
    failures: {
      "GET user/tokens/verify": new CloudflareApiError("GET", "x", 401, []),
    },
  });
  const { credentials } = await prepareR2StateBackend({
    cloudflareApi,
    apiToken,
    accountId,
    bucketName,
  });
  assert.equal(credentials.accessKeyIdentifier, "synthetic-token-id");
  assert.ok(
    cloudflareApi.calls.includes(`GET accounts/${accountId}/tokens/verify`),
  );
});

test("stops without enabling billing when R2 is disabled or the token lacks R2 access", async () => {
  for (const [errorCode, reason] of [
    [10042, /R2 is not enabled/],
    [10000, /cannot read R2 buckets/],
  ]) {
    const cloudflareApi = createFakeCloudflareApi({
      failures: {
        [`GET accounts/${accountId}/r2/buckets`]: new CloudflareApiError(
          "GET",
          "r2/buckets",
          403,
          [{ code: errorCode, message: "synthetic" }],
        ),
      },
    });
    await assert.rejects(
      prepareR2StateBackend({ cloudflareApi, apiToken, accountId, bucketName }),
      (error) =>
        error instanceof StateBackendHardStop && reason.test(error.message),
    );
    assert.ok(!cloudflareApi.calls.some((call) => call.startsWith("POST")));
  }
});

test("the import workflow targets the bucket the backend declares and never applies", () => {
  const workflow = readFileSync(
    new URL(
      "../../../.github/workflows/terraform-state-import.yml",
      import.meta.url,
    ),
    "utf8",
  );
  const backend = readFileSync(
    new URL(
      "../../../infra/environments/production/backend.tf",
      import.meta.url,
    ),
    "utf8",
  );
  const backendBucket = backend.match(/bucket\s*=\s*"([^"]+)"/)[1];
  assert.match(
    workflow,
    new RegExp(`TERRAFORM_STATE_BUCKET: ${backendBucket}\\n`),
  );
  assert.match(backend, /backend "s3"/);
  assert.match(backend, /use_lockfile\s*=\s*true/);
  assert.doesNotMatch(backend, /endpoint|access_key|secret_key|[0-9a-f]{32}/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /\n  (push|pull_request|schedule):/);
  assert.match(workflow, /environment: production/);
  assert.match(
    workflow,
    /group: cloudflare-production\n\s+cancel-in-progress: false/,
  );
  assert.match(workflow, /tofu_wrapper: false/);
  assert.match(workflow, /default: plan/);
  assert.doesNotMatch(workflow, /tofu[^\n]*\bapply\b/);
  assert.match(workflow, /--forbid-live-changes/);
  for (const line of workflow.split("\n")) {
    if (/tofu -chdir[^\n]* (plan|init)/.test(line)) {
      assert.match(line, /> \/dev\/null$/);
    }
  }
});
