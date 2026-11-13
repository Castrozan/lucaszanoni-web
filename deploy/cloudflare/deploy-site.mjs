import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { appRegistry } from "../../packages/config/src/app-registry.ts";
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
export function createApplicationAssetManifest(directory) {
  return Object.fromEntries(
    readdirSync(directory, { recursive: true })
      .sort()
      .filter((path) => statSync(join(directory, path)).isFile())
      .map((path) => [
        path,
        createHash("sha256")
          .update(readFileSync(join(directory, path)))
          .digest("hex"),
      ]),
  );
}

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

function createApplicationBuildManifest(application) {
  const { configuration } = application;
  return {
    applicationId: application.applicationId,
    ...(configuration.assets
      ? {
          assetHashes: createApplicationAssetManifest(
            configuration.assets.directory,
          ),
        }
      : {
          workerSha256: createHash("sha256")
            .update(readFileSync(configuration.main))
            .digest("hex"),
        }),
  };
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
  const settings = await readCloudflare(
    "workers/scripts/lucaszanoni-edge-router/settings",
  );
  const plan = createSiteDeploymentPlan(
    settings,
    appRegistry,
    repositoryDirectory,
    { snapshotDatabaseId: process.env.CLOUDFLARE_SNAPSHOT_DATABASE_ID },
  );
  assertRequiredSecretsPresent(plan.applications, environment);
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
      ["--filter", application.source.appPackageName, "build"],
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
    deployWorker(plan.edgeConfiguration, "edge");
    if (!dryRun) {
      const updatedSettings = await verifyPrivateWorker(
        readCloudflare,
        plan.edgeConfiguration,
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
      for (const binding of settings.bindings.filter(
        (binding) => binding.type === "secret_text",
      )) {
        if (
          !updatedSettings.bindings.some(
            (updated) =>
              updated.name === binding.name && updated.type === "secret_text",
          )
        ) {
          throw new Error(
            `Existing edge secret binding was not retained: ${binding.name}`,
          );
        }
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
      "Usage: node deploy/cloudflare/deploy-site.mjs [--dry-run]\nBuilds registry-owned application profiles, deploys private Workers, then publishes edge service bindings. Requires CLOUDFLARE_API_TOKEN, CLOUDFLARE_SNAPSHOT_DATABASE_ID and INGEST_PRODUCER_SECRET when snapshot ingestion is registered, CLOUDFLARE_SITE_HOSTNAME for private apps, and CLOUDFLARE_ACCOUNT_ID or the production variables file. Existing non-Cloudflare targets and Access policies are not modified.",
    );
  } else {
    if (argumentsList.some((argument) => argument !== "--dry-run"))
      throw new Error("Unknown deployment argument; use --help");
    await deploySite({ dryRun: argumentsList.includes("--dry-run") });
  }
}
