import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AmbiguousImportTarget,
  discoverImportTargets,
  renderImportBlocks,
} from "../../terraform-state/import-target-discovery.mjs";

const accountId = "account-synthetic";
const zoneId = "zone-synthetic";

const creation = (address, type, after) => ({
  address,
  type,
  mode: "managed",
  change: { actions: ["create"], after },
});

const liveObjects = {
  [`zones/${zoneId}/dns_records`]: [
    { id: "record-apex", name: "example.test", type: "A" },
  ],
  [`zones/${zoneId}/settings/ssl`]: { id: "ssl", value: "strict" },
  [`accounts/${accountId}/workers/scripts/edge-router/settings`]: {},
  [`zones/${zoneId}/workers/routes`]: [
    { id: "route-catch-all", pattern: "example.test/*" },
    { id: "route-other", pattern: "other.example.test/*" },
  ],
  [`accounts/${accountId}/access/policies`]: [
    { id: "policy-cockpit", name: "site-cockpit-allow" },
  ],
  [`accounts/${accountId}/access/apps`]: [
    { id: "app-cockpit", name: "site-cockpit", domain: "example.test/cockpit" },
    { id: "app-stale", name: "site-cockpit", domain: "example.test/old" },
  ],
  [`accounts/${accountId}/access/identity_providers`]: [
    { id: "idp-google", name: "Google", type: "google" },
    { id: "idp-pin", name: "PIN", type: "onetimepin" },
  ],
  [`accounts/${accountId}/cfd_tunnel`]: [
    { id: "tunnel-live", name: "session" },
  ],
};

function createFakeCloudflareApi(objects = liveObjects) {
  const lookup = async (path) => {
    const result = objects[path.split("?")[0]];
    if (result === undefined) throw new Error(`unexpected read ${path}`);
    return result;
  };
  return { get: lookup, listAll: lookup };
}

const declaredResources = [
  creation(
    "module.edge[0].cloudflare_dns_record.apex_proxied",
    "cloudflare_dns_record",
    {
      zone_id: zoneId,
      name: "example.test",
      type: "A",
    },
  ),
  creation(
    "module.edge[0].cloudflare_zone_setting.ssl_full_strict",
    "cloudflare_zone_setting",
    {
      zone_id: zoneId,
      setting_id: "ssl",
    },
  ),
  creation(
    "module.edge[0].cloudflare_workers_script.edge_router",
    "cloudflare_workers_script",
    {
      account_id: accountId,
      script_name: "edge-router",
    },
  ),
  creation(
    "module.edge[0].cloudflare_workers_route.edge_router_catch_all",
    "cloudflare_workers_route",
    {
      zone_id: zoneId,
      pattern: "example.test/*",
    },
  ),
  creation(
    'module.access[0].cloudflare_zero_trust_access_policy.app["cockpit"]',
    "cloudflare_zero_trust_access_policy",
    {
      account_id: accountId,
      name: "site-cockpit-allow",
    },
  ),
  creation(
    'module.access[0].cloudflare_zero_trust_access_application.app["cockpit"]',
    "cloudflare_zero_trust_access_application",
    {
      account_id: accountId,
      name: "site-cockpit",
      domain: "example.test/cockpit",
    },
  ),
  creation(
    "module.access[0].cloudflare_zero_trust_access_identity_provider.google[0]",
    "cloudflare_zero_trust_access_identity_provider",
    {
      account_id: accountId,
      name: "Google",
      type: "google",
    },
  ),
  creation(
    "module.tunnel[0].cloudflare_zero_trust_tunnel_cloudflared.this",
    "cloudflare_zero_trust_tunnel_cloudflared",
    {
      account_id: accountId,
      name: "session",
    },
  ),
];

test("resolves every declared resource to its provider import identifier", async () => {
  const targets = await discoverImportTargets(
    { resource_changes: declaredResources },
    createFakeCloudflareApi(),
  );
  assert.deepEqual(
    targets.map((target) => target.importIdentifier),
    [
      `${zoneId}/record-apex`,
      `${zoneId}/ssl`,
      `${accountId}/edge-router`,
      `${zoneId}/route-catch-all`,
      `${accountId}/policy-cockpit`,
      `accounts/${accountId}/app-cockpit`,
      `accounts/${accountId}/idp-google`,
      `${accountId}/tunnel-live`,
    ],
  );
  assert.match(
    renderImportBlocks(targets.slice(5, 6)),
    /^import \{\n  to = module\.access\[0\]\.cloudflare_zero_trust_access_application\.app\["cockpit"\]\n  id = "accounts\/account-synthetic\/app-cockpit"\n\}\n$/,
  );
});

test("stops on a missing, duplicated or unknown live object", async () => {
  const cases = [
    { ...liveObjects, [`accounts/${accountId}/cfd_tunnel`]: [] },
    {
      ...liveObjects,
      [`zones/${zoneId}/dns_records`]: [
        { id: "first", name: "example.test", type: "A" },
        { id: "second", name: "example.test", type: "A" },
      ],
    },
  ];
  for (const objects of cases) {
    await assert.rejects(
      discoverImportTargets(
        { resource_changes: declaredResources },
        createFakeCloudflareApi(objects),
      ),
      AmbiguousImportTarget,
    );
  }
  const unknownName = creation(
    "cloudflare_dns_record.unknown",
    "cloudflare_dns_record",
    {
      zone_id: zoneId,
      type: "A",
    },
  );
  await assert.rejects(
    discoverImportTargets(
      { resource_changes: [unknownName] },
      createFakeCloudflareApi(),
    ),
    /planned name is unknown/,
  );
  const unsupported = creation("random_id.x", "random_id", {});
  await assert.rejects(
    discoverImportTargets(
      { resource_changes: [unsupported] },
      createFakeCloudflareApi(),
    ),
    /no import discovery rule/,
  );
});
