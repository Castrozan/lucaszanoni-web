import assert from "node:assert/strict";
import { test } from "node:test";
import { appRegistry } from "../../../packages/config/src/app-registry.ts";
import { createSiteDeploymentPlan } from "../../cloudflare/application-deployment.mjs";
import {
  settings,
  twoApplicationRegistry,
} from "./site-deployment/fixtures.mjs";

const applicationIds = ["dynamic-ia-canvas", "dynamic-ia-interfaces"];
const inferenceApplications = appRegistry
  .filter((application) => applicationIds.includes(application.id))
  .map((application) => ({
    ...application,
    accessModel: { environment: "public" },
    origin: {
      kind: "cloudflare-worker",
      scriptName: `lucaszanoni-${application.id}`,
    },
  }));
const registry = [...twoApplicationRegistry(), ...inferenceApplications];
const visitorQuotaDurableObjects = {
  bindings: [
    { name: "VISITOR_INFERENCE_QUOTA", class_name: "VisitorInferenceQuota" },
  ],
};
const visitorQuotaMigrations = [
  {
    tag: "visitor-inference-quota-v1",
    new_sqlite_classes: ["VisitorInferenceQuota"],
  },
];

for (const applicationId of applicationIds) {
  test(`${applicationId} uses a native AI binding behind a burst limiter and a strict visitor quota`, () => {
    const plan = createSiteDeploymentPlan(settings, registry, "/repository");
    const application = plan.applications.find(
      (candidate) => candidate.applicationId === applicationId,
    );
    const configuration = application.configuration;
    assert.equal(configuration.workers_dev, false);
    assert.equal(configuration.preview_urls, false);
    assert.deepEqual(configuration.ai, { binding: "AI" });
    assert.deepEqual(configuration.ratelimits, [
      {
        name: "INFERENCE_RATE_LIMITER",
        namespace_id: "1001",
        simple: { limit: 2, period: 60 },
      },
    ]);
    assert.deepEqual(configuration.durable_objects, visitorQuotaDurableObjects);
    assert.deepEqual(configuration.migrations, visitorQuotaMigrations);
    assert.equal(
      configuration.main,
      `/repository/apps/${applicationId}/dist/worker.mjs`,
    );
    assert.deepEqual(configuration.assets, {
      directory: `/repository/apps/${applicationId}/dist/client`,
      binding: "ASSETS",
      run_worker_first: true,
      html_handling: "none",
      not_found_handling: "single-page-application",
    });
    assert.ok(configuration.compatibility_flags.includes("nodejs_compat"));
    assert.ok(
      configuration.compatibility_flags.includes(
        "global_fetch_strictly_public",
      ),
    );
    for (const key of [
      "services",
      "d1_databases",
      "kv_namespaces",
      "r2_buckets",
    ])
      assert.equal(Object.hasOwn(configuration, key), false);
    assert.deepEqual(application.requiredSecrets ?? [], []);
    assert.deepEqual(application.accessModel, { environment: "public" });
  });
}

test("only inference applications carry the visitor limiter and quota", () => {
  const plan = createSiteDeploymentPlan(settings, registry, "/repository");
  for (const application of plan.applications)
    if (!applicationIds.includes(application.applicationId))
      for (const key of ["ratelimits", "durable_objects", "migrations"])
        assert.equal(Object.hasOwn(application.configuration, key), false);
});

test("dynamic snapshot readers carry only the read-only data capability", () => {
  const writer = appRegistry.find((application) => application.id === "ingest");
  const withReader = [
    ...registry.map((application) =>
      application.id === "dynamic-ia-canvas"
        ? {
            ...application,
            accessModel: {
              environment: "private",
              audience: { kind: "owner" },
            },
            capabilities: [...application.capabilities, "snapshot-data"],
          }
        : application,
    ),
    writer,
  ];
  const plan = createSiteDeploymentPlan(settings, withReader, "/repository", {
    snapshotDatabaseId: "0b6f6a5e-3c2d-4a8e-9f10-1234567890ab",
  });
  const configuration = plan.applications.find(
    (application) => application.applicationId === "dynamic-ia-canvas",
  ).configuration;
  assert.deepEqual(configuration.services, [
    {
      binding: "SNAPSHOT_READER",
      service: writer.origin.scriptName,
      entrypoint: "SnapshotReader",
    },
  ]);
});
