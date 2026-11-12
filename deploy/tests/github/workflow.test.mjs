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
    deployment.lastIndexOf("CLOUDFLARE_API_TOKEN:") >
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

const verificationSecrets = [
  "PRODUCTION_TERRAFORM_VARIABLES",
  "CLOUDFLARE_API_TOKEN",
  "CLOUDFLARE_ACCOUNT_ID",
  "EDGE_SHARED_SECRET_VALUE",
  "GOOGLE_SSO_CLIENT_ID",
  "GOOGLE_SSO_CLIENT_SECRET",
  "JARVIS_SESSION_TUNNEL_SECRET",
  "KIRA_SESSION_TUNNEL_SECRET",
  "RIN_SESSION_TUNNEL_SECRET",
  "OWNER_ACCOUNT_EMAIL",
];

function stepNamed(deployment, name) {
  const start = deployment.indexOf(`- name: ${name}`);
  assert.notEqual(start, -1, `${name} step exists`);
  const next = deployment.indexOf("\n      - ", start + 1);
  return deployment.slice(start, next === -1 ? undefined : next);
}

test("only the production deployment job uses the main-only production environment", () => {
  const deploymentStart = workflow.indexOf("\n  deploy-site:");
  const deployment = workflow.slice(deploymentStart);
  assert.match(deployment, /\n    environment: production\n/);
  assert.equal(workflow.match(/^\s+environment:/gm)?.length, 1);
  assert.equal(
    workflow.slice(0, deploymentStart).includes("environment:"),
    false,
  );
});

test("production configuration is verified with step-scoped secrets just before deployment", () => {
  const deployment = workflow.slice(workflow.indexOf("\n  deploy-site:"));
  const verification = stepNamed(
    deployment,
    "Verify migrated production configuration",
  );
  assert.match(
    verification,
    /run: node deploy\/github\/verify-production-configuration\.mjs/,
  );
  for (const secret of verificationSecrets) {
    assert.match(
      verification,
      new RegExp(`${secret}: \\$\\{\\{ secrets\\.${secret} \\}\\}`),
    );
  }
  const deploymentStep = "- name: Deploy private application Workers and edge";
  assert.ok(
    deployment.indexOf("- name: Verify migrated production configuration") >
      deployment.indexOf("- name: Install dependencies"),
  );
  assert.equal(
    deployment.indexOf(`\n      ${deploymentStep}`),
    deployment.indexOf(verification) + verification.length,
  );
});

test("secrets exist only in the two production deployment steps", () => {
  const deployment = workflow.slice(workflow.indexOf("\n  deploy-site:"));
  const beforeDeployment = workflow.slice(
    0,
    workflow.indexOf("\n  deploy-site:"),
  );
  assert.equal(beforeDeployment.includes("secrets."), false);
  const install = stepNamed(deployment, "Install dependencies");
  assert.equal(install.includes("secrets."), false);
  assert.equal(deployment.includes("\n    env:"), false);
});

test("the unmigrated GCP-backed connector credential workflow stays removed", () => {
  assert.equal(
    existsSync(
      new URL(
        "../../../.github/workflows/jarvis-emit-connector-credentials.yml",
        import.meta.url,
      ),
    ),
    false,
  );
});
