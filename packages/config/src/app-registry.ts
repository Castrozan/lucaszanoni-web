import appRegistryDocument from "./app-registry.json" with { type: "json" };
import type { AppRegistryEntry } from "./app-registry/types.ts";
import { parseAppRegistry } from "./app-registry/parser.ts";

export type MicroFrontendId = (typeof appRegistryDocument)[number]["id"];

export const appRegistry: readonly AppRegistryEntry[] =
  parseAppRegistry(appRegistryDocument);
