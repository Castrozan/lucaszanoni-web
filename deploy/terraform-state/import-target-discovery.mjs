export class AmbiguousImportTarget extends Error {}

function exactlyOne(candidates, address, description) {
  if (candidates.length !== 1) {
    throw new AmbiguousImportTarget(
      `${address}: found ${candidates.length} live ${description}, expected exactly one`,
    );
  }
  return candidates[0];
}

function requireKnown(planned, attributes, address) {
  for (const attribute of attributes) {
    if (typeof planned[attribute] !== "string" || planned[attribute] === "") {
      throw new AmbiguousImportTarget(
        `${address}: planned ${attribute} is unknown, so the live object cannot be identified`,
      );
    }
  }
}

const importIdentifierResolvers = {
  cloudflare_dns_record: {
    attributes: ["zone_id", "name", "type"],
    async resolve(cloudflareApi, planned, address) {
      const records = await cloudflareApi.listAll(
        `zones/${planned.zone_id}/dns_records?type=${planned.type}&name.exact=${encodeURIComponent(planned.name)}`,
      );
      const record = exactlyOne(
        records.filter(
          (candidate) =>
            candidate.name === planned.name && candidate.type === planned.type,
        ),
        address,
        `${planned.type} records named ${planned.name}`,
      );
      return `${planned.zone_id}/${record.id}`;
    },
  },
  cloudflare_zone_setting: {
    attributes: ["zone_id", "setting_id"],
    async resolve(cloudflareApi, planned) {
      await cloudflareApi.get(
        `zones/${planned.zone_id}/settings/${planned.setting_id}`,
      );
      return `${planned.zone_id}/${planned.setting_id}`;
    },
  },
  cloudflare_workers_route: {
    attributes: ["zone_id", "pattern"],
    async resolve(cloudflareApi, planned, address) {
      const routes = await cloudflareApi.get(
        `zones/${planned.zone_id}/workers/routes`,
      );
      const route = exactlyOne(
        routes.filter((candidate) => candidate.pattern === planned.pattern),
        address,
        `Workers routes with pattern ${planned.pattern}`,
      );
      return `${planned.zone_id}/${route.id}`;
    },
  },
  cloudflare_zero_trust_access_policy: {
    attributes: ["account_id", "name"],
    async resolve(cloudflareApi, planned, address) {
      const policies = await cloudflareApi.listAll(
        `accounts/${planned.account_id}/access/policies`,
      );
      const policy = exactlyOne(
        policies.filter((candidate) => candidate.name === planned.name),
        address,
        `reusable Access policies named ${planned.name}`,
      );
      return `${planned.account_id}/${policy.id}`;
    },
  },
  cloudflare_zero_trust_access_application: {
    attributes: ["account_id", "name", "domain"],
    async resolve(cloudflareApi, planned, address) {
      const applications = await cloudflareApi.listAll(
        `accounts/${planned.account_id}/access/apps`,
      );
      const application = exactlyOne(
        applications.filter(
          (candidate) =>
            candidate.name === planned.name &&
            candidate.domain === planned.domain,
        ),
        address,
        `Access applications named ${planned.name} on ${planned.domain}`,
      );
      return `accounts/${planned.account_id}/${application.id}`;
    },
  },
  cloudflare_zero_trust_access_identity_provider: {
    attributes: ["account_id", "name", "type"],
    async resolve(cloudflareApi, planned, address) {
      const providers = await cloudflareApi.listAll(
        `accounts/${planned.account_id}/access/identity_providers`,
      );
      const provider = exactlyOne(
        providers.filter(
          (candidate) =>
            candidate.type === planned.type && candidate.name === planned.name,
        ),
        address,
        `${planned.type} identity providers named ${planned.name}`,
      );
      return `accounts/${planned.account_id}/${provider.id}`;
    },
  },
  cloudflare_zero_trust_tunnel_cloudflared: {
    attributes: ["account_id", "name"],
    async resolve(cloudflareApi, planned, address) {
      const tunnels = await cloudflareApi.listAll(
        `accounts/${planned.account_id}/cfd_tunnel?is_deleted=false&name=${encodeURIComponent(planned.name)}`,
      );
      const tunnel = exactlyOne(
        tunnels.filter(
          (candidate) =>
            candidate.name === planned.name && !candidate.deleted_at,
        ),
        address,
        `active tunnels named ${planned.name}`,
      );
      return `${planned.account_id}/${tunnel.id}`;
    },
  },
};

export function plannedCreations(plan) {
  return (plan.resource_changes ?? []).filter(
    (change) =>
      change.mode === "managed" && change.change.actions.includes("create"),
  );
}

export async function discoverImportTargets(plan, cloudflareApi) {
  const targets = [];
  for (const change of plannedCreations(plan)) {
    const resolver = importIdentifierResolvers[change.type];
    if (!resolver) {
      throw new AmbiguousImportTarget(
        `${change.address}: no import discovery rule for ${change.type}`,
      );
    }
    const planned = change.change.after ?? {};
    requireKnown(planned, resolver.attributes, change.address);
    targets.push({
      address: change.address,
      importIdentifier: await resolver.resolve(
        cloudflareApi,
        planned,
        change.address,
      ),
    });
  }
  const identifiers = targets.map((target) => target.importIdentifier);
  if (new Set(identifiers).size !== identifiers.length) {
    throw new AmbiguousImportTarget(
      "Two declared resources resolved to the same live object",
    );
  }
  return targets;
}

export function renderImportBlocks(targets) {
  return targets
    .map(
      ({ address, importIdentifier }) =>
        `import {\n  to = ${address}\n  id = ${JSON.stringify(importIdentifier)}\n}\n`,
    )
    .join("\n");
}
