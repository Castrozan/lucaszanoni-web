import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { appRegistry } from "../../packages/config/src/app-registry.ts";
import {
  assertPrivateApplicationAccess,
  createApplicationBuildEnvironment,
  createSiteDeploymentPlan,
} from "./application-deployment.mjs";
import {
  assertApplicationWorkerCanBeUpdated,
  createCloudflareReader,
  verifyPrivateWorker,
} from "./cloudflare-client.mjs";

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

function runCommand(argumentsList, repositoryDirectory, environment) {
  const result = spawnSync("pnpm", argumentsList, {
    cwd: repositoryDirectory,
    env: environment,
    stdio: "inherit",
  });
  if (result.status !== 0)
    throw new Error(
      `Deployment command failed: pnpm ${argumentsList.slice(0, 3).join(" ")}`,
    );
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
  );
  const accessApplications = plan.applications.some(
    (application) => application.accessModel.environment !== "public",
  )
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
    assertApplicationWorkerCanBeUpdated(existing, application.applicationId);
  }
  for (const application of plan.applications) {
    runCommand(
      ["--filter", application.source.appPackageName, "build"],
      repositoryDirectory,
      createApplicationBuildEnvironment(application.source, environment),
    );
  }
  const configurationDirectory = mkdtempSync(
    join(tmpdir(), "site-cloudflare-"),
  );
  try {
    const deployWorker = (configuration, index) => {
      const configurationPath = join(configurationDirectory, `${index}.json`);
      writeFileSync(configurationPath, JSON.stringify(configuration), {
        mode: 0o600,
      });
      runCommand(
        [
          "exec",
          "wrangler",
          "deploy",
          "--config",
          configurationPath,
          ...(dryRun ? ["--dry-run"] : []),
        ],
        repositoryDirectory,
        environment,
      );
    };
    for (const [index, application] of plan.applications.entries()) {
      deployWorker(application.configuration, index);
      if (!dryRun)
        await verifyPrivateWorker(readCloudflare, application.configuration);
    }
    deployWorker(plan.edgeConfiguration, "edge");
    if (!dryRun) {
      const updatedSettings = await verifyPrivateWorker(
        readCloudflare,
        plan.edgeConfiguration,
      );
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
      "Usage: node deploy/cloudflare/deploy-site.mjs [--dry-run]\nBuilds registry-owned static apps, deploys private Workers, then publishes edge service bindings. Requires CLOUDFLARE_API_TOKEN, CLOUDFLARE_SITE_HOSTNAME for private apps, and CLOUDFLARE_ACCOUNT_ID or the production variables file. Existing non-Cloudflare targets and Access policies are not modified.",
    );
  } else {
    if (argumentsList.some((argument) => argument !== "--dry-run"))
      throw new Error("Unknown deployment argument; use --help");
    await deploySite({ dryRun: argumentsList.includes("--dry-run") });
  }
}
