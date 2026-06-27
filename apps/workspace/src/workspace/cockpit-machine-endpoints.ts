import { resolveCockpitLifecycleEndpoint } from "./cockpit-lifecycle-endpoint";

export interface CockpitWorkspaceMachine {
  readonly key: string;
  readonly label: string;
  readonly endpoint: string;
}

export interface CockpitWorkspaceMachinesResolution {
  readonly configuredMachines?: string | null;
  readonly baseEndpoint?: string | null;
}

const LOCAL_MACHINE_KEY = "local";
const LOCAL_MACHINE_LABEL = "Local";

export function resolveCockpitWorkspaceMachines(
  resolution: CockpitWorkspaceMachinesResolution = {},
): readonly CockpitWorkspaceMachine[] {
  const configuredMachines =
    resolution.configuredMachines !== undefined
      ? resolution.configuredMachines
      : import.meta.env.VITE_COCKPIT_WORKSPACE_MACHINES;
  const machines = parseConfiguredWorkspaceMachines(configuredMachines);
  if (machines.length > 0) {
    return machines;
  }
  const baseEndpoint =
    resolution.baseEndpoint !== undefined
      ? resolution.baseEndpoint
      : resolveCockpitLifecycleEndpoint();
  if (!baseEndpoint) {
    return [];
  }
  return [
    {
      key: LOCAL_MACHINE_KEY,
      label: LOCAL_MACHINE_LABEL,
      endpoint: baseEndpoint,
    },
  ];
}

function parseConfiguredWorkspaceMachines(
  configuredMachines: string | null | undefined,
): CockpitWorkspaceMachine[] {
  if (!configuredMachines) {
    return [];
  }
  const machines: CockpitWorkspaceMachine[] = [];
  const seenKeys = new Set<string>();
  for (const entry of configuredMachines.split(",")) {
    const trimmedEntry = entry.trim();
    if (trimmedEntry.length === 0) {
      continue;
    }
    const firstSeparator = trimmedEntry.indexOf(":");
    const secondSeparator =
      firstSeparator === -1
        ? -1
        : trimmedEntry.indexOf(":", firstSeparator + 1);
    if (firstSeparator === -1 || secondSeparator === -1) {
      continue;
    }
    const key = trimmedEntry.slice(0, firstSeparator).trim();
    const endpoint = trimmedEntry.slice(secondSeparator + 1).trim();
    if (key.length === 0 || endpoint.length === 0 || seenKeys.has(key)) {
      continue;
    }
    const label =
      trimmedEntry.slice(firstSeparator + 1, secondSeparator).trim() || key;
    seenKeys.add(key);
    machines.push({ key, label, endpoint });
  }
  return machines;
}
