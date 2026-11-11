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

export async function verifyPrivateWorker(readCloudflare, configuration) {
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
  for (const service of configuration.services ?? []) {
    if (
      !settings.bindings.some(
        (binding) =>
          binding.type === "service" &&
          binding.name === service.binding &&
          binding.service === service.service,
      )
    ) {
      throw new Error(`Worker service readback differs for ${service.binding}`);
    }
  }
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

export function assertApplicationWorkerCanBeUpdated(settings, applicationId) {
  if (!settings) return;
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
  if (
    settings.bindings.some((binding) =>
      binding.type === "assets"
        ? binding.name !== "ASSETS"
        : binding.type !== "plain_text" ||
          !["APPLICATION_ID", "APPLICATION_MOUNT_PATH"].includes(binding.name),
    )
  ) {
    throw new Error(
      `Application ${applicationId} has unrecognized bindings that require inspection`,
    );
  }
}
