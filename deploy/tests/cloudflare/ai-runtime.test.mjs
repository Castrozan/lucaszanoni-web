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

for (const applicationId of applicationIds) {
  test(`${applicationId} uses a rate-limited native AI binding and storage-free OpenNext adapter`, () => {
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
    assert.equal(
      configuration.main,
      `/repository/apps/${applicationId}/cloudflare/build/.open-next/worker.js`,
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
    for (const key of [
      "d1_databases",
      "kv_namespaces",
      "r2_buckets",
      "durable_objects",
    ])
      assert.equal(Object.hasOwn(configuration, key), false);
    assert.deepEqual(application.requiredSecrets ?? [], []);
    assert.deepEqual(application.accessModel, { environment: "public" });
  });
}

test("every inference application shares one visitor rate limit namespace", () => {
  const plan = createSiteDeploymentPlan(settings, registry, "/repository");
  const limiters = plan.applications
    .filter((application) => applicationIds.includes(application.applicationId))
    .map((application) => application.configuration.ratelimits);
  assert.equal(limiters.length, applicationIds.length);
  assert.deepEqual(limiters[0], limiters[1]);
  for (const application of plan.applications)
    if (!applicationIds.includes(application.applicationId))
      assert.equal(
        Object.hasOwn(application.configuration, "ratelimits"),
        false,
      );
});

test("local wrangler configurations declare the deployed visitor rate limiter", () => {
  const plan = createSiteDeploymentPlan(settings, registry, "/repository");
  for (const applicationId of applicationIds) {
    const deployed = plan.applications.find(
      (candidate) => candidate.applicationId === applicationId,
    ).configuration.ratelimits;
    const local = JSON.parse(
      readFileSync(
        new URL(
          `../../../apps/${applicationId}/cloudflare/wrangler.json`,
          import.meta.url,
        ),
        "utf8",
      ),
    ).ratelimits;
    assert.deepEqual(local, deployed, applicationId);
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
};
const rateLimiterBinding = {
  type: "ratelimit",
  name: "INFERENCE_RATE_LIMITER",
  namespace_id: "1001",
  simple: { limit: 2, period: 60 },
};
const ownedBindings = Object.entries(configuration.vars).map(
  ([name, text]) => ({ name, text, type: "plain_text" }),
);
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
