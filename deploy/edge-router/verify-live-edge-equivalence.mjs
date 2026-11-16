import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { appRegistry } from "../../packages/config/src/app-registry.ts";
import { selectWorkerApplications } from "../cloudflare/application-deployment.mjs";
import { createCloudflareReader } from "../cloudflare/cloudflare-client.mjs";
import {
  EDGE_ROUTER_SCRIPT_NAME,
  readEdgeProductionConfiguration,
} from "./edge-production-configuration.mjs";
import {
  createEdgeWorkerConfiguration,
  EDGE_WORKER_SECRETS,
} from "./edge-worker-configuration.mjs";
import { compareEdgeWorkerSettings } from "./edge-worker-settings-comparison.mjs";

export async function verifyLiveEdgeEquivalence({
  environment,
  readCloudflare,
}) {
  const configuration = createEdgeWorkerConfiguration({
    registry: appRegistry,
    workerApplications: selectWorkerApplications(appRegistry),
    configuration: readEdgeProductionConfiguration(environment),
    repositoryDirectory: resolve(
      fileURLToPath(new URL("../..", import.meta.url)),
    ),
  });
  const liveSettings = await readCloudflare(
    `workers/scripts/${EDGE_ROUTER_SCRIPT_NAME}/settings`,
  );
  return compareEdgeWorkerSettings(
    configuration,
    EDGE_WORKER_SECRETS,
    liveSettings,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN } = process.env;
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN)
    throw new Error(
      "CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN are required",
    );
  const { differingKeys, routingTableByteIdentical } =
    await verifyLiveEdgeEquivalence({
      environment: process.env,
      readCloudflare: createCloudflareReader(
        CLOUDFLARE_ACCOUNT_ID,
        CLOUDFLARE_API_TOKEN,
      ),
    });
  console.log(
    `Edge equivalence: ${differingKeys.length === 0 ? "match" : "mismatch"}; routing table byte-identical: ${routingTableByteIdentical}`,
  );
  for (const key of differingKeys) console.log(`differs: ${key}`);
  if (differingKeys.length > 0) process.exitCode = 1;
}
