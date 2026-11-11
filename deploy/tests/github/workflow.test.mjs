import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

const workflow = readFileSync(
  new URL("../../../.github/workflows/ci.yml", import.meta.url),
  "utf8",
);

test("production deployment requires every GitHub verification job and only a main push", () => {
  const deployment = workflow.slice(workflow.indexOf("\n  deploy-site:"));
  assert.ok(workflow.includes("\n  deploy-site:"));
  assert.match(
    deployment,
    /github\.event_name == 'push' && github\.ref == 'refs\/heads\/main'/,
  );
  for (const job of [
    "build-and-test",
    "cockpit-e2e",
    "shell-e2e",
    "cloudflare-edge-module-test",
    "cloudflare-access-module-test",
    "cloudflare-jarvis-tunnel-module-test",
  ]) {
    assert.match(workflow, new RegExp(`\\n  ${job}:`));
    const needs = deployment.slice(
      deployment.indexOf("needs:"),
      deployment.indexOf("runs-on:"),
    );
    assert.ok(needs.includes(job));
  }
  assert.match(deployment, /node deploy\/cloudflare\/deploy-site\.mjs/);
  assert.ok(
    deployment.indexOf("CLOUDFLARE_API_TOKEN:") >
      deployment.indexOf("- name: Deploy private application Workers and edge"),
  );
  assert.match(
    deployment,
    /CLOUDFLARE_API_TOKEN: \$\{\{ secrets\.CLOUDFLARE_API_TOKEN \}\}/,
  );
  assert.match(
    deployment,
    /CLOUDFLARE_ACCOUNT_ID: \$\{\{ secrets\.CLOUDFLARE_ACCOUNT_ID \}\}/,
  );
  assert.match(deployment, /cancel-in-progress: false/);
  assert.match(workflow, /contents: read/);
  assert.doesNotMatch(
    workflow,
    /id-token: write|google-github-actions\/auth|terraform apply|tofu apply|gcloud /,
  );
});

test("GitHub verification exercises all deployment contracts and native multi-Worker routing", () => {
  assert.match(workflow, /node --test deploy\/tests\/\*\/\*\.test\.mjs/);
  assert.match(workflow, /node deploy\/cloudflare\/verify-local-site\.mjs/);
  assert.match(workflow, /pnpm --filter @platform\/shell e2e/);
  assert.match(workflow, /node-version: 22\.22\.2/);
  assert.match(
    workflow,
    /cancel-in-progress: \$\{\{ github\.ref != 'refs\/heads\/main' \}\}/,
  );
  for (const obsolete of ["deploy-apps.yml", "deploy-infrastructure.yml"]) {
    assert.equal(
      existsSync(
        new URL(`../../../.github/workflows/${obsolete}`, import.meta.url),
      ),
      false,
    );
  }
});
