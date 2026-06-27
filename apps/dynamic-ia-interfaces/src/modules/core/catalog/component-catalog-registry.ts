import type { ZodType } from "zod";
import type { ComponentCatalogEntry } from "../types/component-catalog-entry";
import { ComponentNotFoundInCatalogError } from "../errors/dynamic-interface-error";

const registeredCatalogEntries = new Map<string, ComponentCatalogEntry>();

export function registerComponentInCatalog<PropsSchema extends ZodType>(
  catalogEntry: ComponentCatalogEntry<PropsSchema>,
): void {
  registeredCatalogEntries.set(catalogEntry.catalogEntryName, catalogEntry);
}

export function lookupComponentInCatalog(
  componentName: string,
): ComponentCatalogEntry {
  const catalogEntry = registeredCatalogEntries.get(componentName);
  if (!catalogEntry) {
    throw new ComponentNotFoundInCatalogError(componentName);
  }
  return catalogEntry;
}

export function getAllRegisteredCatalogEntries(): readonly ComponentCatalogEntry[] {
  return Array.from(registeredCatalogEntries.values());
}

export function generateCatalogSchemaForSystemPrompt(): string {
  const catalogEntries = getAllRegisteredCatalogEntries();
  const schemaDescriptions = catalogEntries.map((entry) => ({
    name: entry.catalogEntryName,
    description: entry.catalogEntryDescription,
    propsSchema: JSON.stringify(entry.propsValidationSchema),
  }));
  return JSON.stringify(schemaDescriptions, null, 2);
}

export function clearComponentCatalogForTesting(): void {
  registeredCatalogEntries.clear();
}
