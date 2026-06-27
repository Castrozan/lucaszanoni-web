import { describe, it, expect, beforeEach } from "vitest";
import { z } from "zod";
import {
  registerComponentInCatalog,
  lookupComponentInCatalog,
  getAllRegisteredCatalogEntries,
  generateCatalogSchemaForSystemPrompt,
  clearComponentCatalogForTesting,
} from "./component-catalog-registry";
import { ComponentNotFoundInCatalogError } from "../errors/dynamic-interface-error";

function createMockReactComponent() {
  return function MockComponent() {
    return null;
  };
}

describe("component-catalog-registry", () => {
  beforeEach(() => {
    clearComponentCatalogForTesting();
  });

  it("registers a component and retrieves it by name", () => {
    const mockEntry = {
      catalogEntryName: "WeatherCard",
      catalogEntryDescription: "Displays weather information",
      propsValidationSchema: z.object({ temperature: z.number() }),
      reactComponentRenderer: createMockReactComponent(),
      supportedLifecycleStates: ["output-available" as const],
    };

    registerComponentInCatalog(mockEntry);
    const retrieved = lookupComponentInCatalog("WeatherCard");

    expect(retrieved.catalogEntryName).toBe("WeatherCard");
    expect(retrieved.catalogEntryDescription).toBe(
      "Displays weather information",
    );
  });

  it("throws ComponentNotFoundInCatalogError for unregistered component", () => {
    expect(() => lookupComponentInCatalog("NonExistent")).toThrow(
      ComponentNotFoundInCatalogError,
    );
  });

  it("returns all registered entries", () => {
    registerComponentInCatalog({
      catalogEntryName: "CardA",
      catalogEntryDescription: "First card",
      propsValidationSchema: z.object({}),
      reactComponentRenderer: createMockReactComponent(),
      supportedLifecycleStates: ["output-available" as const],
    });

    registerComponentInCatalog({
      catalogEntryName: "CardB",
      catalogEntryDescription: "Second card",
      propsValidationSchema: z.object({}),
      reactComponentRenderer: createMockReactComponent(),
      supportedLifecycleStates: ["output-available" as const],
    });

    const allEntries = getAllRegisteredCatalogEntries();
    expect(allEntries).toHaveLength(2);
  });

  it("generates catalog schema as JSON string for system prompt", () => {
    registerComponentInCatalog({
      catalogEntryName: "DataTable",
      catalogEntryDescription: "Renders tabular data",
      propsValidationSchema: z.object({ rows: z.array(z.unknown()) }),
      reactComponentRenderer: createMockReactComponent(),
      supportedLifecycleStates: [
        "input-available" as const,
        "output-available" as const,
      ],
    });

    const schemaJson = generateCatalogSchemaForSystemPrompt();
    const parsed = JSON.parse(schemaJson);

    expect(parsed).toHaveLength(1);
    expect(parsed[0].name).toBe("DataTable");
    expect(parsed[0].description).toBe("Renders tabular data");
  });

  it("overwrites entry when registering with same name", () => {
    registerComponentInCatalog({
      catalogEntryName: "Card",
      catalogEntryDescription: "Version 1",
      propsValidationSchema: z.object({}),
      reactComponentRenderer: createMockReactComponent(),
      supportedLifecycleStates: ["output-available" as const],
    });

    registerComponentInCatalog({
      catalogEntryName: "Card",
      catalogEntryDescription: "Version 2",
      propsValidationSchema: z.object({}),
      reactComponentRenderer: createMockReactComponent(),
      supportedLifecycleStates: ["output-available" as const],
    });

    const retrieved = lookupComponentInCatalog("Card");
    expect(retrieved.catalogEntryDescription).toBe("Version 2");
    expect(getAllRegisteredCatalogEntries()).toHaveLength(1);
  });
});
