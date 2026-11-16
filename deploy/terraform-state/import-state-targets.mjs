import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const [workingDirectory, variablesFilePath, importTargetsPath] =
  process.argv.slice(2);

const EMPTY_STATE_MESSAGE = "No state file was found";

function runTofu(argumentsList) {
  const result = spawnSync(
    "tofu",
    [`-chdir=${workingDirectory}`, ...argumentsList],
    { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
  );
  if (result.status !== 0) {
    throw new Error(
      `tofu ${argumentsList[0]} failed:\n${result.stderr.trim()}`,
    );
  }
  return result.stdout;
}

function listManagedAddresses() {
  try {
    return runTofu(["state", "list"]).split("\n").filter(Boolean);
  } catch (error) {
    if (error.message.includes(EMPTY_STATE_MESSAGE)) return [];
    throw error;
  }
}

try {
  if (!workingDirectory || !variablesFilePath || !importTargetsPath) {
    throw new Error(
      "Usage: import-state-targets.mjs <working-directory> <variables.tfvars.json> <import-targets.json>",
    );
  }
  const targets = JSON.parse(readFileSync(importTargetsPath, "utf8"));
  const managedAddresses = new Set(listManagedAddresses());
  let importedCount = 0;
  for (const { address, importIdentifier } of targets) {
    if (managedAddresses.has(address)) {
      console.log(`already in state ${address}`);
      continue;
    }
    runTofu([
      "import",
      "-input=false",
      `-var-file=${variablesFilePath}`,
      address,
      importIdentifier,
    ]);
    importedCount += 1;
    console.log(`imported ${address}`);
  }
  console.log(
    `Imported ${importedCount} resources into state; ${targets.length - importedCount} were already present`,
  );
} catch (error) {
  console.error(`ERROR: ${error.message}`);
  process.exitCode = 1;
}
