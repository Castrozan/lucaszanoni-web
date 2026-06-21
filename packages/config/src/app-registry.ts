import appRegistryDocument from "./app-registry.json";
import type { AppRegistryEntry } from "./app-registry-types";
import { parseAppRegistry } from "./app-registry-parser";

export type MicroFrontendId = (typeof appRegistryDocument)[number]["id"];

export const appRegistry: readonly AppRegistryEntry[] =
  parseAppRegistry(appRegistryDocument);
