import type { AppRegistryEntry } from "./types.ts";
import { parseAppRegistry } from "./parser.ts";

export function appendEntryToRegistryDocument(
  currentRegistryJson: string,
  entry: AppRegistryEntry,
): string {
  const currentRegistry = JSON.parse(currentRegistryJson) as AppRegistryEntry[];
  const nextRegistry = parseAppRegistry([...currentRegistry, entry]);
  return `${JSON.stringify(nextRegistry, null, 2)}\n`;
}
