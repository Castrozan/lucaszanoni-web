import { isDeepStrictEqual } from "node:util";
import {
  assertDeclaredBindingsPresent,
  assertExistingBindingsAreDeclared,
} from "./worker-bindings.mjs";

export function assertAccessApplicationsUnchanged(
  previousApplications,
  currentApplications,
) {
  const sorted = (applications) =>
    [...applications].sort((left, right) => left.id.localeCompare(right.id));
  if (
    !isDeepStrictEqual(
      sorted(previousApplications),
      sorted(currentApplications),
    )
  ) {
    throw new Error("Access applications changed during deployment");
  }
}

export function createCloudflareReader(accountId, apiToken) {
  return async (path, { allowMissing = false } = {}) => {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/${path}`,
      {
        headers: { Authorization: ["Bearer", apiToken].join(" ") },
        signal: AbortSignal.timeout(30_000),
      },
    );
    if (allowMissing && response.status === 404) return null;
    if (!response.ok)
      throw new Error(`Cloudflare read failed: HTTP ${response.status}`);
    const payload = await response.json();
    if (!payload.success) throw new Error("Cloudflare read was rejected");
    return payload.result;
  };
}

export async function verifyPrivateWorker(
  readCloudflare,
  configuration,
  requiredSecrets = [],
) {
  const basePath = `workers/scripts/${configuration.name}`;
  const settings = await readCloudflare(`${basePath}/settings`);
  const endpoints = await readCloudflare(`${basePath}/subdomain`);
  if (endpoints.enabled || endpoints.previews_enabled) {
    throw new Error(`Unexpected public Worker URL on ${configuration.name}`);
  }
  for (const [name, value] of Object.entries(configuration.vars ?? {})) {
    if (
      !settings.bindings.some(
        (binding) =>
          binding.name === name &&
          binding.type === "plain_text" &&
          binding.text === value,
      )
    ) {
      throw new Error(
        `Worker variable readback differs for ${configuration.name}: ${name}`,
      );
    }
  }
  assertDeclaredBindingsPresent(
    settings.bindings,
    configuration,
    requiredSecrets,
  );
  if (
    configuration.assets &&
    !settings.bindings.some(
      (binding) => binding.type === "assets" && binding.name === "ASSETS",
    )
  ) {
    throw new Error(
      `Application asset binding missing on ${configuration.name}`,
    );
  }
  if (
    !configuration.assets &&
    settings.bindings.some((binding) => binding.type === "assets")
  ) {
    throw new Error(`Unexpected shared asset binding on ${configuration.name}`);
  }
  return settings;
}

export async function assertApplicationDatabasesMatch(
  readCloudflare,
  applications,
) {
  for (const application of applications) {
    for (const database of application.configuration.d1_databases ?? []) {
      const observed = await readCloudflare(
        `d1/database/${database.database_id}`,
      );
      if (
        observed.uuid !== database.database_id ||
        observed.name !== database.database_name
      ) {
        throw new Error(
          `Application database target differs for ${database.database_name}`,
        );
      }
    }
  }
}

export function assertApplicationWorkerCanBeUpdated(settings, application) {
  if (!settings) return;
  const { applicationId } = application;
  if (
    !settings.bindings.some(
      (binding) =>
        binding.name === "APPLICATION_ID" &&
        binding.type === "plain_text" &&
        binding.text === applicationId,
    )
  ) {
    throw new Error(
      `Existing Worker is not owned by application ${applicationId}`,
    );
  }
  assertExistingBindingsAreDeclared(
    settings.bindings,
    applicationId,
    application.configuration,
    application.requiredSecrets,
  );
}
