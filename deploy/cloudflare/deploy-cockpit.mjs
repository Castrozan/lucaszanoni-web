import { readFileSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { cockpitForwardedBuildArgSpecs } from "../cockpit-build-config/cockpit-build-arg-forwarding.mjs";

export function createCockpitDeploymentConfiguration(
  settings,
  registry,
  repositoryDirectory,
) {
  const unsupportedBindings = settings.bindings.filter(
    (binding) =>
      !["plain_text", "secret_text", "assets"].includes(binding.type),
  );
  if (unsupportedBindings.length > 0) {
    throw new Error(
      "Unrecognized Worker bindings require inspection before deployment",
    );
  }
  const assetApplications = registry.filter(
    (entry) => entry.origin.kind === "in-repo-worker-assets",
  );
  if (assetApplications.length !== 1 || assetApplications[0].id !== "cockpit") {
    throw new Error(
      "The asset deployment requires exactly one Cockpit application",
    );
  }
  const application = assetApplications[0];
  const variables = Object.fromEntries(
    settings.bindings
      .filter((binding) => binding.type === "plain_text")
      .map((binding) => [binding.name, binding.text]),
  );
  const routingTable = JSON.parse(variables.EDGE_ROUTES);
  routingTable.prefixes = routingTable.prefixes.filter(
    (route) => route.prefix !== application.mountPath,
  );
  routingTable.workerAssetsPrefixes = [{ prefix: application.mountPath }];
  variables.EDGE_ROUTES = JSON.stringify(routingTable);
  return {
    name: "lucaszanoni-edge-router",
    main: resolve(
      repositoryDirectory,
      "infra/modules/cloudflare-edge/edge-router-worker.mjs",
    ),
    compatibility_date: settings.compatibility_date,
    compatibility_flags: settings.compatibility_flags ?? [],
    workers_dev: false,
    preview_urls: false,
    keep_vars: true,
    vars: variables,
    assets: {
      directory: resolve(
        repositoryDirectory,
        "apps",
        application.origin.appDirectoryName,
        "dist",
      ),
      binding: "ASSETS",
      run_worker_first: true,
      html_handling: "none",
      not_found_handling: "single-page-application",
    },
  };
}

export function createCockpitBuildEnvironment(environment) {
  const buildEnvironment = {
    ...environment,
    VITE_COCKPIT_REAL_COMPUTE: "true",
  };
  for (const specification of cockpitForwardedBuildArgSpecs) {
    if (environment[specification.secretName]) {
      buildEnvironment[specification.buildArg] =
        environment[specification.secretName];
    }
  }
  return buildEnvironment;
}

export async function deployCockpit({ dryRun = false } = {}) {
  const repositoryDirectory = resolve(
    fileURLToPath(new URL("../..", import.meta.url)),
  );
  const productionVariables = process.env.PRODUCTION_TERRAFORM_VARIABLES
    ? JSON.parse(
        readFileSync(process.env.PRODUCTION_TERRAFORM_VARIABLES, "utf8"),
      )
    : {};
  const accountId =
    process.env.CLOUDFLARE_ACCOUNT_ID ??
    productionVariables.cloudflare_account_id;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiToken)
    throw new Error(
      "Cloudflare account and deployment credential are required",
    );
  const apiGet = async (path) => {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/${path}`,
      { headers: { Authorization: `Bearer ${apiToken}` } },
    );
    if (!response.ok)
      throw new Error(`Cloudflare read failed: HTTP ${response.status}`);
    const payload = await response.json();
    if (!payload.success) throw new Error("Cloudflare read was rejected");
    return payload.result;
  };
  const settingsPath = `accounts/${accountId}/workers/scripts/lucaszanoni-edge-router/settings`;
  const settings = await apiGet(settingsPath);
  const registry = JSON.parse(
    readFileSync(
      join(repositoryDirectory, "packages/config/src/app-registry.json"),
      "utf8",
    ),
  );
  const configuration = createCockpitDeploymentConfiguration(
    settings,
    registry,
    repositoryDirectory,
  );
  const environment = createCockpitBuildEnvironment({
    ...process.env,
    CLOUDFLARE_ACCOUNT_ID: accountId,
  });
  const build = spawnSync("pnpm", ["--filter", "@platform/cockpit", "build"], {
    cwd: repositoryDirectory,
    env: environment,
    stdio: "inherit",
  });
  if (build.status !== 0) throw new Error("Cockpit build failed");
  const configurationDirectory = mkdtempSync(
    join(tmpdir(), "cockpit-cloudflare-"),
  );
  try {
    const configurationPath = join(configurationDirectory, "wrangler.json");
    writeFileSync(configurationPath, JSON.stringify(configuration), {
      mode: 0o600,
    });
    const argumentsList = [
      "exec",
      "wrangler",
      "deploy",
      "--config",
      configurationPath,
    ];
    if (dryRun) argumentsList.push("--dry-run");
    const deployment = spawnSync("pnpm", argumentsList, {
      cwd: repositoryDirectory,
      env: environment,
      stdio: "inherit",
    });
    if (deployment.status !== 0)
      throw new Error("Cloudflare-only deployment failed");
    if (!dryRun) {
      const updatedSettings = await apiGet(settingsPath);
      const updatedBindings = updatedSettings.bindings;
      if (
        !updatedBindings.some(
          (binding) => binding.name === "ASSETS" && binding.type === "assets",
        )
      )
        throw new Error("Static asset binding was not retained");
      if (
        !updatedBindings.some(
          (binding) =>
            binding.name === "EDGE_SHARED_SECRET" &&
            binding.type === "secret_text",
        )
      )
        throw new Error("Existing edge secret binding was not retained");
      const updatedRoutes = updatedBindings.find(
        (binding) => binding.name === "EDGE_ROUTES",
      )?.text;
      if (
        JSON.stringify(JSON.parse(updatedRoutes)) !==
        JSON.stringify(JSON.parse(configuration.vars.EDGE_ROUTES))
      )
        throw new Error(
          "Cloudflare routing readback differs from the requested update",
        );
      const publicEndpoints = await apiGet(
        `accounts/${accountId}/workers/scripts/lucaszanoni-edge-router/subdomain`,
      );
      if (publicEndpoints.enabled || publicEndpoints.previews_enabled)
        throw new Error("An unexpected public Worker URL is enabled");
    }
  } finally {
    rmSync(configurationDirectory, { recursive: true, force: true });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await deployCockpit({ dryRun: process.argv.includes("--dry-run") });
}
