import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { appRegistry } from "../../packages/config/src/app-registry.ts";
import { createApplicationBuildManifest } from "./application-build-manifest.mjs";
import { createApplicationBuildArguments } from "./application-runtime-profile.mjs";
import {
  createApplicationBuildEnvironment,
  createSiteDeploymentPlan,
} from "./application-deployment.mjs";
import { assertPrivateApplicationAccess } from "./private-application-access.mjs";
import {
  assertRequiredSecretsPresent,
  createWorkerDeployer,
  runPnpmCommand,
} from "./worker-deployment-execution.mjs";
import {
  assertApplicationWorkerCanBeUpdated,
  assertApplicationDatabasesMatch,
  assertAccessApplicationsUnchanged,
  createCloudflareReader,
  verifyPrivateWorker,
} from "./cloudflare-client.mjs";
import { readEdgeProductionConfiguration } from "../edge-router/edge-production-configuration.mjs";
import { compareEdgeWorkerSettings } from "../edge-router/edge-worker-settings-comparison.mjs";
import { EDGE_WORKER_SECRETS } from "../edge-router/edge-worker-configuration.mjs";

function readDeploymentAccount(environment) {
  if (environment.CLOUDFLARE_ACCOUNT_ID)
    return environment.CLOUDFLARE_ACCOUNT_ID;
  if (!environment.PRODUCTION_TERRAFORM_VARIABLES) return undefined;
  try {
    return JSON.parse(
      readFileSync(environment.PRODUCTION_TERRAFORM_VARIABLES, "utf8"),
    ).cloudflare_account_id;
  } catch {
    throw new Error("Production deployment configuration is not valid JSON");
  }
}

export async function deploySite({ dryRun = false } = {}) {
  const repositoryDirectory = resolve(
    fileURLToPath(new URL("../..", import.meta.url)),
  );
  const accountId = readDeploymentAccount(process.env);
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiToken)
    throw new Error(
      "Cloudflare account and deployment credential are required",
    );
  const environment = {
    ...process.env,
    CLOUDFLARE_ACCOUNT_ID: accountId,
    WRANGLER_SEND_METRICS: "false",
  };
  const readCloudflare = createCloudflareReader(accountId, apiToken);
  const plan = createSiteDeploymentPlan(
    readEdgeProductionConfiguration(environment),
    appRegistry,
    repositoryDirectory,
    { snapshotDatabaseId: process.env.CLOUDFLARE_SNAPSHOT_DATABASE_ID },
  );
  assertRequiredSecretsPresent(
    [
      ...plan.applications,
      { applicationId: "edge-router", requiredSecrets: EDGE_WORKER_SECRETS },
    ],
    environment,
  );
  await assertApplicationDatabasesMatch(readCloudflare, plan.applications);
  const requiresPrivateAccess = plan.applications.some(
    (application) => application.accessModel.environment !== "public",
  );
  const accessApplications = requiresPrivateAccess
    ? await readCloudflare("access/apps")
    : [];
  assertPrivateApplicationAccess(
    plan.applications,
    accessApplications,
    environment.CLOUDFLARE_SITE_HOSTNAME,
  );
  for (const application of plan.applications) {
    const existing = await readCloudflare(
      `workers/scripts/${application.configuration.name}/settings`,
      { allowMissing: true },
    );
    assertApplicationWorkerCanBeUpdated(existing, application);
  }
  for (const application of plan.applications) {
    runPnpmCommand(
      createApplicationBuildArguments(application.source),
      repositoryDirectory,
      createApplicationBuildEnvironment(application.source, environment),
    );
    console.log(JSON.stringify(createApplicationBuildManifest(application)));
  }
  const configurationDirectory = mkdtempSync(
    join(tmpdir(), "site-cloudflare-"),
  );
  try {
    const deployWorker = createWorkerDeployer({
      repositoryDirectory,
      environment,
      configurationDirectory,
      dryRun,
    });
    for (const [index, application] of plan.applications.entries()) {
      deployWorker(
        application.configuration,
        index,
        application.requiredSecrets,
      );
      if (!dryRun)
        await verifyPrivateWorker(
          readCloudflare,
          application.configuration,
          application.requiredSecrets,
        );
    }
    deployWorker(plan.edgeConfiguration, "edge", EDGE_WORKER_SECRETS);
    if (!dryRun) {
      const updatedSettings = await verifyPrivateWorker(
        readCloudflare,
        plan.edgeConfiguration,
        EDGE_WORKER_SECRETS,
      );
      const { differingKeys } = compareEdgeWorkerSettings(
        plan.edgeConfiguration,
        EDGE_WORKER_SECRETS,
        updatedSettings,
      );
      if (differingKeys.length > 0)
        throw new Error(
          `Edge router readback differs from the repository: ${differingKeys.join(", ")}`,
        );
      if (requiresPrivateAccess) {
        assertAccessApplicationsUnchanged(
          accessApplications,
          await readCloudflare("access/apps"),
        );
        console.log(
          `Verified Access configuration unchanged for ${accessApplications.length} applications`,
        );
      }
    }
    console.log(
      `${dryRun ? "Validated" : "Deployed and read back"} ${plan.applications.length} private application Workers and the edge router`,
    );
  } finally {
    rmSync(configurationDirectory, { recursive: true, force: true });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const argumentsList = process.argv.slice(2);
  if (argumentsList.includes("--help")) {
    console.log(
      "Usage: node deploy/cloudflare/deploy-site.mjs [--dry-run]\nBuilds registry-owned application profiles, deploys private Workers, then publishes the edge router with its routing table, service bindings and shared secret computed from the repository. Requires CLOUDFLARE_API_TOKEN, EDGE_SHARED_SECRET, ENABLE_DOTCOM_CANONICAL, ENABLE_KIRA_SESSION_TUNNEL and ENABLE_RIN_SESSION_TUNNEL, CLOUDFLARE_SNAPSHOT_DATABASE_ID and INGEST_PRODUCER_SECRET when snapshot ingestion is registered, CLOUDFLARE_SITE_HOSTNAME for private apps, and CLOUDFLARE_ACCOUNT_ID or the production variables file. Existing non-Cloudflare targets and Access policies are not modified.",
    );
  } else {
    if (argumentsList.some((argument) => argument !== "--dry-run"))
      throw new Error("Unknown deployment argument; use --help");
    await deploySite({ dryRun: argumentsList.includes("--dry-run") });
  }
}
