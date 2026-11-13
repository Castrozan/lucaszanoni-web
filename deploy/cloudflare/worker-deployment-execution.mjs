import { rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

export function runPnpmCommand(
  argumentsList,
  repositoryDirectory,
  environment,
) {
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

export function assertRequiredSecretsPresent(applications, environment) {
  for (const application of applications) {
    for (const name of application.requiredSecrets ?? []) {
      if (!environment[name])
        throw new Error(
          `Required environment secret ${name} is missing for ${application.applicationId}`,
        );
    }
  }
}

export function createWorkerDeployer({
  repositoryDirectory,
  environment,
  configurationDirectory,
  dryRun,
  runCommand = runPnpmCommand,
}) {
  const runWrangler = (argumentsList) =>
    runCommand(
      ["exec", "wrangler", ...argumentsList],
      repositoryDirectory,
      environment,
    );
  return (configuration, label, requiredSecrets = []) => {
    const configurationPath = join(configurationDirectory, `${label}.json`);
    const secretsPath = join(configurationDirectory, `${label}.secrets.json`);
    writeFileSync(configurationPath, JSON.stringify(configuration), {
      mode: 0o600,
    });
    try {
      if (requiredSecrets.length > 0)
        writeFileSync(
          secretsPath,
          JSON.stringify(
            Object.fromEntries(
              requiredSecrets.map((name) => [name, environment[name]]),
            ),
          ),
          { mode: 0o600 },
        );
      for (const database of configuration.d1_databases ?? []) {
        if (!dryRun)
          runWrangler([
            "d1",
            "migrations",
            "apply",
            database.binding,
            "--remote",
            "--config",
            configurationPath,
          ]);
      }
      runWrangler([
        "deploy",
        "--config",
        configurationPath,
        "--autoconfig=false",
        ...(requiredSecrets.length > 0 ? ["--secrets-file", secretsPath] : []),
        ...(dryRun ? ["--dry-run"] : []),
      ]);
    } finally {
      rmSync(secretsPath, { force: true });
    }
  };
}
