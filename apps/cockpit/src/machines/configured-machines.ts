import type { CockpitMachine } from "./machine-registry";

export function parseConfiguredMachines(raw: string): CockpitMachine[] {
  const machines: CockpitMachine[] = [];
  const seenKeys = new Set<string>();
  for (const entry of raw.split(",")) {
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

export function readConfiguredMachines(): CockpitMachine[] {
  return parseConfiguredMachines(import.meta.env.VITE_COCKPIT_MACHINES ?? "");
}
