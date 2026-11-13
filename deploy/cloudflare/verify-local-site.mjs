import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { appRegistry } from "../../packages/config/src/app-registry.ts";
import {
  createApplicationBuildEnvironment,
  createSiteDeploymentPlan,
} from "./application-deployment.mjs";
import { verifyStaticApplicationResponses } from "./local-site/static-application-responses.mjs";
import {
  LOCAL_FIXTURE_PRODUCER_SECRET,
  verifySnapshotDataResponses,
} from "./local-site/snapshot-data-responses.mjs";
import { withLocalWorkerRuntime } from "./local-site/worker-runtime.mjs";

const LOCAL_FIXTURE_DATABASE_ID = "00000000-0000-0000-0000-000000000001";
const SNAPSHOT_READER_BINDING = "SNAPSHOT_READER";
const EXPECTED_SNAPSHOT_READER_IDS = ["cockpit", "reports", "usage-dashboard"];

function findSnapshotWriter(plan) {
  return plan.applications.find(
    (application) => application.configuration.d1_databases !== undefined,
  );
}

function findSnapshotReaders(plan) {
  return plan.applications.filter((application) =>
    application.configuration.services?.some(
      (service) => service.binding === SNAPSHOT_READER_BINDING,
    ),
  );
}

function withFixtureProducerSecret(application, writer) {
  if (application !== writer) return application.configuration;
  return {
    ...application.configuration,
    vars: {
      ...application.configuration.vars,
      INGEST_PRODUCER_SECRET: LOCAL_FIXTURE_PRODUCER_SECRET,
    },
  };
}

export async function verifyLocalSite(sourceRegistry = appRegistry) {
  const repositoryDirectory = resolve(
    fileURLToPath(new URL("../..", import.meta.url)),
  );
  const registry = sourceRegistry
    .filter(
      (application) =>
        ["shell", "cockpit"].includes(application.id) ||
        application.origin.kind === "cloudflare-worker",
    )
    .map((application) => ({
      ...application,
      origin: {
        kind: "cloudflare-worker",
        scriptName: `lucaszanoni-${application.id}`,
      },
    }));
  const settings = {
    compatibility_date: "2024-11-01",
    bindings: [
      {
        name: "EDGE_ROUTES",
        type: "plain_text",
        text: JSON.stringify({ shell: null, prefixes: [] }),
      },
    ],
  };
  const plan = createSiteDeploymentPlan(
    settings,
    registry,
    repositoryDirectory,
    {
      snapshotDatabaseId: LOCAL_FIXTURE_DATABASE_ID,
    },
  );
  const writer = findSnapshotWriter(plan);
  const readers = findSnapshotReaders(plan);
  assert.ok(writer, "Local verification requires a snapshot-ingestion writer");
  assert.deepEqual(
    readers.map((reader) => reader.applicationId).sort(),
    EXPECTED_SNAPSHOT_READER_IDS,
  );
  const environment = {
    ...process.env,
    CI: "true",
    WRANGLER_SEND_METRICS: "false",
  };
  for (const application of plan.applications) {
    const result = spawnSync(
      "pnpm",
      ["--filter", application.source.appPackageName, "build"],
      {
        cwd: repositoryDirectory,
        env: createApplicationBuildEnvironment(application.source, environment),
        stdio: "inherit",
      },
    );
    if (result.status !== 0)
      throw new Error(
        `Local application build failed: ${application.applicationId}`,
      );
  }
  const staticApplications = plan.applications.filter(
    (application) => application.configuration.assets !== undefined,
  );
  const configurations = [
    plan.edgeConfiguration,
    ...plan.applications.map((application) =>
      withFixtureProducerSecret(application, writer),
    ),
  ];
  const checks = await withLocalWorkerRuntime(
    { repositoryDirectory, environment, configurations },
    async ({ origin }) => [
      ...(await verifyStaticApplicationResponses(origin, staticApplications)),
      ...(await verifySnapshotDataResponses(origin, writer, readers)),
    ],
  );
  console.log(
    JSON.stringify(
      {
        status: "passed",
        applications: staticApplications.map(
          (application) => application.applicationId,
        ),
        dataWriter: writer.applicationId,
        dataReaders: readers.map((reader) => reader.applicationId),
        checks: checks.length,
        verified: checks,
      },
      null,
      2,
    ),
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await verifyLocalSite();
