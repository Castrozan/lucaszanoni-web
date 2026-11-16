import assert from "node:assert/strict";
import { test } from "node:test";
import fc from "fast-check";
import { appRegistry } from "../../../packages/config/src/app-registry.ts";
import { selectWorkerApplications } from "../../cloudflare/application-deployment.mjs";
import { createEdgeProductionConfiguration } from "../../edge-router/edge-production-configuration.mjs";
import {
  createEdgeWorkerConfiguration,
  EDGE_WORKER_SECRETS,
} from "../../edge-router/edge-worker-configuration.mjs";
import { compareEdgeWorkerSettings } from "../../edge-router/edge-worker-settings-comparison.mjs";
import { verifyLiveEdgeEquivalence } from "../../edge-router/verify-live-edge-equivalence.mjs";

const productionEnvironment = {
  ENABLE_DOTCOM_CANONICAL: "true",
  ENABLE_KIRA_SESSION_TUNNEL: "true",
  ENABLE_RIN_SESSION_TUNNEL: "true",
};

const configuration = createEdgeWorkerConfiguration({
  registry: appRegistry,
  workerApplications: selectWorkerApplications(appRegistry),
  configuration: createEdgeProductionConfiguration({
    dotcomCanonical: true,
    kiraSessionTunnel: true,
    rinSessionTunnel: true,
  }),
  repositoryDirectory: "/repository",
});

function reorderKeys(value, reverse) {
  if (Array.isArray(value))
    return value.map((item) => reorderKeys(item, reverse));
  if (value === null || typeof value !== "object") return value;
  const keys = Object.keys(value).sort();
  return Object.fromEntries(
    (reverse ? keys.reverse() : keys).map((key) => [
      key,
      reorderKeys(value[key], reverse),
    ]),
  );
}

function liveSettingsDeployedFrom(
  expected,
  routingTableText = expected.vars.EDGE_ROUTES,
) {
  return {
    compatibility_date: expected.compatibility_date,
    compatibility_flags: [],
    bindings: [
      ...expected.services.map(({ binding, service }) => ({
        name: binding,
        type: "service",
        service,
        environment: "production",
      })),
      { name: "EDGE_SHARED_SECRET", type: "secret_text" },
      {
        name: "EDGE_SHARED_SECRET_HEADER_NAME",
        type: "plain_text",
        text: expected.vars.EDGE_SHARED_SECRET_HEADER_NAME,
      },
      { name: "EDGE_ROUTES", type: "plain_text", text: routingTableText },
    ],
  };
}

test("a live edge deployed from the same repository state matches byte for byte", () => {
  assert.deepEqual(
    compareEdgeWorkerSettings(
      configuration,
      EDGE_WORKER_SECRETS,
      liveSettingsDeployedFrom(configuration),
    ),
    { differingKeys: [], routingTableByteIdentical: true },
  );
});

test("route order, key order and empty sections do not count as routing differences", () => {
  const routingTable = JSON.parse(configuration.vars.EDGE_ROUTES);
  fc.assert(
    fc.property(
      fc.boolean(),
      fc.func(fc.integer()),
      fc.boolean(),
      (reverseKeys, orderingSeed, omitEmptySections) => {
        const reordered = Object.fromEntries(
          Object.entries(reorderKeys(routingTable, reverseKeys))
            .filter(
              ([, section]) =>
                !omitEmptySections ||
                (Array.isArray(section) && section.length > 0) ||
                (!Array.isArray(section) && section !== null),
            )
            .map(([name, section]) => [
              name,
              Array.isArray(section)
                ? [...section].sort(
                    (left, right) =>
                      orderingSeed(JSON.stringify(left)) -
                      orderingSeed(JSON.stringify(right)),
                  )
                : section,
            ]),
        );
        const { differingKeys } = compareEdgeWorkerSettings(
          configuration,
          EDGE_WORKER_SECRETS,
          liveSettingsDeployedFrom(configuration, JSON.stringify(reordered)),
        );
        assert.deepEqual(differingKeys, []);
      },
    ),
  );
});

test("each changed routing section or binding is reported by name without values", () => {
  const routingTable = JSON.parse(configuration.vars.EDGE_ROUTES);
  const sections = Object.keys(routingTable);
  fc.assert(
    fc.property(
      fc.constantFrom(...sections),
      fc.string({ minLength: 1 }),
      (section, unexpectedValue) => {
        const changed = {
          ...routingTable,
          [section]: [{ prefix: `/${unexpectedValue}` }],
        };
        const result = compareEdgeWorkerSettings(
          configuration,
          EDGE_WORKER_SECRETS,
          liveSettingsDeployedFrom(configuration, JSON.stringify(changed)),
        );
        assert.deepEqual(result.differingKeys, [`EDGE_ROUTES.${section}`]);
        assert.equal(result.routingTableByteIdentical, false);
      },
    ),
  );
  const live = liveSettingsDeployedFrom(configuration);
  live.bindings = live.bindings
    .filter((binding) => binding.name !== "APP_SHELL")
    .concat([
      { name: "LEFTOVER_SECRET", type: "secret_text" },
      { name: "LEFTOVER_STORE", type: "kv_namespace" },
    ]);
  live.compatibility_date = "2023-01-01";
  assert.deepEqual(
    compareEdgeWorkerSettings(configuration, EDGE_WORKER_SECRETS, live)
      .differingKeys,
    [
      "binding.APP_SHELL",
      "binding.LEFTOVER_SECRET",
      "binding.LEFTOVER_STORE",
      "compatibility_date",
    ],
  );
});

test("the live equivalence check reads only the edge router settings", async () => {
  const readPaths = [];
  const result = await verifyLiveEdgeEquivalence({
    environment: productionEnvironment,
    readCloudflare: async (path) => {
      readPaths.push(path);
      return liveSettingsDeployedFrom(configuration);
    },
  });
  assert.deepEqual(readPaths, [
    "workers/scripts/lucaszanoni-edge-router/settings",
  ]);
  assert.deepEqual(result, {
    differingKeys: [],
    routingTableByteIdentical: true,
  });
});
