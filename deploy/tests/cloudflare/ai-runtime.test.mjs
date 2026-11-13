import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import fc from "fast-check";
import { appRegistry } from "../../../packages/config/src/app-registry.ts";
import { createSiteDeploymentPlan } from "../../cloudflare/application-deployment.mjs";
import {
  assertApplicationWorkerCanBeUpdated,
  verifyPrivateWorker,
} from "../../cloudflare/cloudflare-client.mjs";
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
      `/repository/apps/${applicationId}/cloudflare/worker.mjs`,
    );
    assert.equal(
      configuration.assets.directory,
      `/repository/apps/${applicationId}/cloudflare/build/.open-next/assets`,
    );
    assert.equal(configuration.assets.binding, "ASSETS");
    assert.ok(configuration.compatibility_flags.includes("nodejs_compat"));
    assert.ok(
      configuration.compatibility_flags.includes(
        "global_fetch_strictly_public",
      ),
    );
    assert.deepEqual(configuration.services, [
      { binding: "WORKER_SELF_REFERENCE", service: configuration.name },
    ]);
    for (const key of ["d1_databases", "kv_namespaces", "r2_buckets"])
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

test("local wrangler configurations declare the deployed entry, limiter and quota", () => {
  const plan = createSiteDeploymentPlan(settings, registry, "/repository");
  for (const applicationId of applicationIds) {
    const deployed = plan.applications.find(
      (candidate) => candidate.applicationId === applicationId,
    ).configuration;
    const local = JSON.parse(
      readFileSync(
        new URL(
          `../../../apps/${applicationId}/cloudflare/wrangler.json`,
          import.meta.url,
        ),
        "utf8",
      ),
    );
    for (const key of ["ratelimits", "durable_objects", "migrations"])
      assert.deepEqual(local[key], deployed[key], `${applicationId} ${key}`);
    assert.equal(
      deployed.main,
      `/repository/apps/${applicationId}/cloudflare/${local.main}`,
    );
  }
});

test("dynamic snapshot readers retain both the self-reference and read-only data capability", () => {
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
    { binding: "WORKER_SELF_REFERENCE", service: configuration.name },
    {
      binding: "SNAPSHOT_READER",
      service: writer.origin.scriptName,
      entrypoint: "SnapshotReader",
    },
  ]);
});

const configuration = {
  name: "native-ai-test",
  vars: { APPLICATION_ID: "native-ai", APPLICATION_MOUNT_PATH: "/native-ai/" },
  ai: { binding: "AI" },
  ratelimits: [
    {
      name: "INFERENCE_RATE_LIMITER",
      namespace_id: "1001",
      simple: { limit: 2, period: 60 },
    },
  ],
  durable_objects: visitorQuotaDurableObjects,
};
const visitorQuotaBinding = {
  type: "durable_object_namespace",
  name: "VISITOR_INFERENCE_QUOTA",
  class_name: "VisitorInferenceQuota",
  namespace_id: "0f2ac74b498b48028cb68387c421e279",
};
const rateLimiterBinding = {
  type: "ratelimit",
  name: "INFERENCE_RATE_LIMITER",
  namespace_id: "1001",
  simple: { limit: 2, period: 60 },
};
const ownedBindings = [
  ...Object.entries(configuration.vars).map(([name, text]) => ({
    name,
    text,
    type: "plain_text",
  })),
  visitorQuotaBinding,
];
const application = { applicationId: "native-ai", configuration };
const readback = (bindings) => async (path) =>
  path.endsWith("/subdomain")
    ? { enabled: false, previews_enabled: false }
    : { bindings };

test("preflight accepts only the declared native inference binding name", () => {
  fc.assert(
    fc.property(fc.string(), (name) => {
      const check = () =>
        assertApplicationWorkerCanBeUpdated(
          {
            bindings: [
              ...ownedBindings,
              rateLimiterBinding,
              { type: "ai", name },
            ],
          },
          application,
        );
      if (name === "AI") assert.doesNotThrow(check);
      else assert.throws(check, /unrecognized bindings/);
    }),
    { numRuns: 100, examples: [["AI"]] },
  );
});

test("postdeployment readback rejects a missing or renamed native inference binding", async () => {
  await verifyPrivateWorker(
    readback([
      ...ownedBindings,
      rateLimiterBinding,
      { type: "ai", name: "AI" },
    ]),
    configuration,
  );
  await fc.assert(
    fc.asyncProperty(
      fc.string().filter((name) => name !== "AI"),
      async (name) => {
        await assert.rejects(
          verifyPrivateWorker(
            readback([
              ...ownedBindings,
              rateLimiterBinding,
              { type: "ai", name },
            ]),
            configuration,
          ),
          /AI.*readback/,
        );
      },
    ),
    { numRuns: 100 },
  );
  await assert.rejects(
    verifyPrivateWorker(
      readback([...ownedBindings, rateLimiterBinding]),
      configuration,
    ),
    /AI.*readback/,
  );
});

test("readback rejects a missing or reconfigured visitor rate limiter", async () => {
  const aiBinding = { type: "ai", name: "AI" };
  for (const drifted of [
    { ...rateLimiterBinding, name: "OTHER_LIMITER" },
    { ...rateLimiterBinding, namespace_id: "1002" },
    { ...rateLimiterBinding, simple: { limit: 200, period: 60 } },
  ])
    await assert.rejects(
      verifyPrivateWorker(
        readback([...ownedBindings, aiBinding, drifted]),
        configuration,
      ),
      /rate limiter.*readback|unrecognized bindings/,
    );
  await assert.rejects(
    verifyPrivateWorker(readback([...ownedBindings, aiBinding]), configuration),
    /rate limiter.*readback/,
  );
});

test("readback rejects a missing or reassigned visitor quota", async () => {
  const declared = [
    ...ownedBindings.filter((binding) => binding !== visitorQuotaBinding),
    rateLimiterBinding,
    { type: "ai", name: "AI" },
  ];
  for (const drifted of [
    { ...visitorQuotaBinding, name: "OTHER_QUOTA" },
    { ...visitorQuotaBinding, class_name: "OtherQuota" },
  ])
    await assert.rejects(
      verifyPrivateWorker(readback([...declared, drifted]), configuration),
      /durable object.*readback|unrecognized bindings/,
    );
  await assert.rejects(
    verifyPrivateWorker(readback(declared), configuration),
    /durable object.*readback/,
  );
  assert.throws(
    () =>
      assertApplicationWorkerCanBeUpdated(
        { bindings: [...declared, { ...visitorQuotaBinding, name: "X" }] },
        application,
      ),
    /unrecognized bindings/,
  );
});
