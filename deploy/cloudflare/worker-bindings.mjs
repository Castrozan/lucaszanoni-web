const OWNED_VARIABLE_NAMES = ["APPLICATION_ID", "APPLICATION_MOUNT_PATH"];
const DEFAULT_SERVICE_ENVIRONMENT = "production";

export function serviceBindingMatches(binding, expected) {
  return (
    binding.type === "service" &&
    binding.name === expected.binding &&
    binding.service === expected.service &&
    (binding.environment ?? DEFAULT_SERVICE_ENVIRONMENT) ===
      (expected.environment ?? DEFAULT_SERVICE_ENVIRONMENT) &&
    (binding.entrypoint ?? "default") === (expected.entrypoint ?? "default")
  );
}

export function databaseBindingMatches(binding, expected) {
  return (
    binding.type === "d1" &&
    binding.name === expected.binding &&
    binding.id === expected.database_id
  );
}

export function assertDeclaredBindingsPresent(
  bindings,
  configuration,
  requiredSecrets = [],
) {
  for (const database of configuration.d1_databases ?? []) {
    if (!bindings.some((binding) => databaseBindingMatches(binding, database)))
      throw new Error(
        `Worker database readback differs for ${database.binding}`,
      );
  }
  for (const service of configuration.services ?? []) {
    if (!bindings.some((binding) => serviceBindingMatches(binding, service)))
      throw new Error(`Worker service readback differs for ${service.binding}`);
  }
  for (const name of requiredSecrets) {
    if (
      !bindings.some(
        (binding) => binding.type === "secret_text" && binding.name === name,
      )
    )
      throw new Error(`Worker secret readback differs for ${name}`);
  }
}

function isDeclaredBinding(binding, configuration, requiredSecrets) {
  switch (binding.type) {
    case "assets":
      return binding.name === "ASSETS";
    case "plain_text":
      return OWNED_VARIABLE_NAMES.includes(binding.name);
    case "secret_text":
      return requiredSecrets.includes(binding.name);
    case "d1":
      return (configuration.d1_databases ?? []).some((database) =>
        databaseBindingMatches(binding, database),
      );
    case "service":
      return (configuration.services ?? []).some((service) =>
        serviceBindingMatches(binding, service),
      );
    default:
      return false;
  }
}

export function assertExistingBindingsAreDeclared(
  bindings,
  applicationId,
  configuration,
  requiredSecrets = [],
) {
  if (
    bindings.some(
      (binding) => !isDeclaredBinding(binding, configuration, requiredSecrets),
    )
  ) {
    throw new Error(
      `Application ${applicationId} has unrecognized bindings that require inspection`,
    );
  }
}
