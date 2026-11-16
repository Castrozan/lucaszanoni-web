import { readFileSync, writeFileSync } from "node:fs";
import { createCloudflareApi } from "./cloudflare-api.mjs";
import {
  AmbiguousImportTarget,
  discoverImportTargets,
  renderImportBlocks,
} from "./import-target-discovery.mjs";

const [discoveryPlanPath, importBlocksPath, importTargetsPath] =
  process.argv.slice(2);

try {
  if (!discoveryPlanPath || !importBlocksPath || !importTargetsPath) {
    throw new Error(
      "Usage: discover-import-targets.mjs <discovery-plan.json> <imports.tf> <import-targets.json>",
    );
  }
  const plan = JSON.parse(readFileSync(discoveryPlanPath, "utf8"));
  const targets = await discoverImportTargets(
    plan,
    createCloudflareApi(process.env.CLOUDFLARE_API_TOKEN),
  );
  writeFileSync(importBlocksPath, renderImportBlocks(targets));
  writeFileSync(importTargetsPath, JSON.stringify(targets));
  for (const { address } of targets) console.log(`matched ${address}`);
  console.log(`Matched ${targets.length} declared resources to live objects`);
} catch (error) {
  const prefix =
    error instanceof AmbiguousImportTarget ? "HARD STOP: " : "ERROR: ";
  console.error(`${prefix}${error.message}`);
  process.exitCode = 1;
}
