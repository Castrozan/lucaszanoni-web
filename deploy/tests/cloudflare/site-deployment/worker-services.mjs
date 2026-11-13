import assert from "node:assert/strict";
import { test } from "node:test";
import { createSiteDeploymentPlan } from "../../../cloudflare/application-deployment.mjs";
import { assertRequiredSecretsPresent } from "../../../cloudflare/worker-deployment-execution.mjs";

const databaseId = "0b6f6a5e-3c2d-4a8e-9f10-1234567890ab";
const owner = { environment: "private", audience: { kind: "owner" } };
const shared = {
  environment: "private",
  audience: { kind: "shared", audienceKey: "family" },
};
const settings = {
  compatibility_date: "2024-11-01",
  compatibility_flags: ["nodejs_compat"],
  bindings: [
    {
      name: "EDGE_ROUTES",
      type: "plain_text",
      text: JSON.stringify({ prefixes: [] }),
    },
  ],
};

const base = (id, profile, accessModel, capabilities = []) => ({
  id,
  mountPath: `/${id}/`,
  navigationLabel: id,
  description: id,
  showInCrossSectionNavigation: false,
  status: "active",
  accessModel,
  capabilities,
  source: {
    appPackageName: `@platform/${id}`,
    appDirectoryName: id,
    buildProfile: profile,
    publicBuildEnvironment: {},
    publicBuildEnvironmentReferences: {},
  },
  origin: { kind: "cloudflare-worker", scriptName: `lucaszanoni-${id}` },
});
const entry = (id, { profile, capabilities, accessModel = owner }) =>
  base(id, profile, accessModel, capabilities);
const writer = (id = "ingest") =>
  base(id, "worker-service", owner, ["snapshot-ingestion"]);
const reader = (id = "viewer", access = owner) =>
  base(id, "static-spa", access, ["snapshot-data"]);
const plan = (registry, runtime = { snapshotDatabaseId: databaseId }) =>
  createSiteDeploymentPlan(settings, registry, "/repository", runtime);

test("a generic worker-service needs no database or secret and keeps nodejs_compat unique", () => {
  const [application] = plan(
    [entry("plain", { profile: "worker-service" })],
    undefined,
  ).applications;
  assert.equal(
    application.configuration.main,
    "/repository/apps/plain/dist/worker.mjs",
  );
  assert.deepEqual(application.configuration.compatibility_flags, [
    "nodejs_compat",
  ]);
  assert.equal(Object.hasOwn(application.configuration, "assets"), false);
  assert.equal(Object.hasOwn(application.configuration, "d1_databases"), false);
  assert.equal(Object.hasOwn(application, "requiredSecrets"), false);
  assert.deepEqual(application.configuration.vars, {
    APPLICATION_ID: "plain",
    APPLICATION_MOUNT_PATH: "/plain/",
  });
});

test("the snapshot writer binds the exact database and declares its secret outside public vars", () => {
  const [application] = plan([writer()]).applications;
  assert.deepEqual(application.configuration.d1_databases, [
    {
      binding: "SNAPSHOT_DATABASE",
      database_name: "lucaszanoni-site-snapshots",
      database_id: databaseId,
      migrations_dir: "/repository/apps/ingest/migrations",
    },
  ]);
  assert.deepEqual(application.requiredSecrets, ["INGEST_PRODUCER_SECRET"]);
  assert.doesNotMatch(
    JSON.stringify(application.configuration),
    /INGEST_PRODUCER_SECRET/,
  );
});

test("database identifiers fail before any plan exists unless they are UUIDs", () => {
  for (const snapshotDatabaseId of [
    undefined,
    "",
    "not-a-uuid",
    `${databaseId} `,
    7,
  ]) {
    assert.throws(
      () => plan([writer()], { snapshotDatabaseId }),
      /CLOUDFLARE_SNAPSHOT_DATABASE_ID/,
    );
  }
  assert.throws(() => plan([writer()], {}), /CLOUDFLARE_SNAPSHOT_DATABASE_ID/);
});

test("writer and reader combinations are exhaustively fail-closed", () => {
  const cases = [
    { registry: [reader()], error: /exactly one/ },
    { registry: [writer("a"), writer("b")], error: /exactly one/ },
    { registry: [writer("a"), writer("b"), reader()], error: /exactly one/ },
    {
      registry: [writer(), reader("viewer", shared)],
      error: /private owner-audience/,
    },
    {
      registry: [writer(), reader("viewer", { environment: "public" })],
      error: /private owner-audience/,
    },
    {
      registry: [
        entry("ingest", {
          profile: "static-spa",
          capabilities: ["snapshot-ingestion"],
        }),
      ],
      error: /worker-service/,
    },
    {
      registry: [
        entry("both", {
          profile: "worker-service",
          capabilities: ["snapshot-ingestion", "snapshot-data"],
        }),
      ],
      error: /distinct from the writer/,
    },
  ];
  for (const { registry, error } of cases)
    assert.throws(() => plan(registry), error);
});

test("an owner reader binds the writer entrypoint and the writer deploys before every reader", () => {
  const registry = [reader("aaa"), reader("zzz"), writer("mmm")];
  const { applications } = plan(registry);
  assert.deepEqual(
    applications.map((application) => application.applicationId),
    ["mmm", "aaa", "zzz"],
  );
  for (const application of applications.slice(1)) {
    assert.deepEqual(application.configuration.services, [
      {
        binding: "SNAPSHOT_READER",
        service: "lucaszanoni-mmm",
        entrypoint: "SnapshotReader",
      },
    ]);
    assert.equal(application.configuration.assets.binding, "ASSETS");
  }
});

test("static plans without capabilities are unchanged by runtime configuration", () => {
  const registry = [entry("static", { profile: "static-spa" })];
  assert.deepEqual(
    plan(registry, { snapshotDatabaseId: "x" }),
    plan(registry, undefined),
  );
  const [application] = plan(registry).applications;
  assert.equal(
    application.configuration.main,
    "/repository/deploy/cloudflare/static-application-worker.mjs",
  );
  assert.equal(Object.hasOwn(application, "requiredSecrets"), false);
});

test("missing environment secrets are named without values before any build", () => {
  const [application] = plan([writer()]).applications;
  assert.throws(
    () => assertRequiredSecretsPresent([application], {}),
    /INGEST_PRODUCER_SECRET is missing for ingest/,
  );
  assert.doesNotThrow(() =>
    assertRequiredSecretsPresent([application], {
      INGEST_PRODUCER_SECRET: "x",
    }),
  );
});
