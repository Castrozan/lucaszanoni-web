import { serviceBindingMatches } from "../cloudflare/worker-bindings.mjs";

const ROUTING_TABLE_BINDING = "EDGE_ROUTES";

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value !== null && typeof value === "object")
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  return JSON.stringify(value);
}

function canonicalRoutingSection(section) {
  if (section === undefined || section === null) return "absent";
  if (!Array.isArray(section)) return canonicalJson(section);
  if (section.length === 0) return "absent";
  return `[${section.map(canonicalJson).sort().join(",")}]`;
}

function parseRoutingTable(serialized) {
  try {
    const parsed = JSON.parse(serialized);
    return parsed !== null && typeof parsed === "object" ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function routingTableDifferences(expectedSerialized, liveSerialized) {
  const expected = JSON.parse(expectedSerialized);
  const live = parseRoutingTable(liveSerialized);
  if (!live) return [ROUTING_TABLE_BINDING];
  return [...new Set([...Object.keys(expected), ...Object.keys(live)])]
    .sort()
    .filter(
      (section) =>
        canonicalRoutingSection(expected[section]) !==
        canonicalRoutingSection(live[section]),
    )
    .map((section) => `${ROUTING_TABLE_BINDING}.${section}`);
}

function expectedBindingMatches(configuration, secretNames, binding) {
  if (binding.type === "plain_text")
    return configuration.vars[binding.name] === binding.text;
  if (binding.type === "secret_text") return secretNames.includes(binding.name);
  if (binding.type === "service")
    return configuration.services.some((service) =>
      serviceBindingMatches(binding, service),
    );
  return false;
}

function bindingDifferences(configuration, secretNames, liveBindings) {
  const expectedNames = [
    ...Object.keys(configuration.vars),
    ...secretNames,
    ...configuration.services.map((service) => service.binding),
  ];
  const liveByName = new Map(
    liveBindings.map((binding) => [binding.name, binding]),
  );
  const names = [...new Set([...expectedNames, ...liveByName.keys()])].sort();
  return names.flatMap((name) => {
    const live = liveByName.get(name);
    if (name === ROUTING_TABLE_BINDING && live?.type === "plain_text")
      return routingTableDifferences(configuration.vars[name], live.text);
    if (
      live &&
      expectedNames.includes(name) &&
      expectedBindingMatches(configuration, secretNames, live)
    )
      return [];
    return [`binding.${name}`];
  });
}

export function compareEdgeWorkerSettings(
  configuration,
  secretNames,
  liveSettings,
) {
  const differingKeys = bindingDifferences(
    configuration,
    secretNames,
    liveSettings.bindings ?? [],
  );
  if (liveSettings.compatibility_date !== configuration.compatibility_date)
    differingKeys.push("compatibility_date");
  if (
    canonicalJson(liveSettings.compatibility_flags ?? []) !==
    canonicalJson(configuration.compatibility_flags)
  )
    differingKeys.push("compatibility_flags");
  const liveRoutingTable = (liveSettings.bindings ?? []).find(
    (binding) => binding.name === ROUTING_TABLE_BINDING,
  );
  return {
    differingKeys,
    routingTableByteIdentical:
      liveRoutingTable?.text === configuration.vars[ROUTING_TABLE_BINDING],
  };
}
