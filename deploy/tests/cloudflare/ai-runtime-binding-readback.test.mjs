import assert from "node:assert/strict";
import { test } from "node:test";
import fc from "fast-check";
import {
  assertApplicationWorkerCanBeUpdated,
  verifyPrivateWorker,
} from "../../cloudflare/cloudflare-client.mjs";

const visitorQuotaDurableObjects = {
  bindings: [
    { name: "VISITOR_INFERENCE_QUOTA", class_name: "VisitorInferenceQuota" },
  ],
};
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

test("preflight rejects the retired OpenNext self-reference binding", () => {
  assert.throws(
    () =>
      assertApplicationWorkerCanBeUpdated(
        {
          bindings: [
            ...ownedBindings,
            rateLimiterBinding,
            { type: "ai", name: "AI" },
            {
              type: "service",
              name: "WORKER_SELF_REFERENCE",
              service: configuration.name,
            },
          ],
        },
        application,
      ),
    /unrecognized bindings/,
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
