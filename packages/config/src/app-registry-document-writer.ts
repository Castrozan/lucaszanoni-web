import type { AppRegistryEntry } from "./app-registry-types";

export function appendEntryToRegistryDocument(
  currentRegistryJson: string,
  entry: AppRegistryEntry,
): string {
  const currentRegistry = JSON.parse(currentRegistryJson) as AppRegistryEntry[];
  const nextRegistry = [...currentRegistry, entry];
  return `${JSON.stringify(nextRegistry, null, 2)}\n`;
}
