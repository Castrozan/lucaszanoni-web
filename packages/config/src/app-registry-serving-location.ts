import type {
  AppRegistryEntry,
  AppServingLocation,
} from "./app-registry-types";

export const defaultServingLocation: AppServingLocation = {
  kind: "path-prefix",
};

export function resolveServingLocation(
  entry: AppRegistryEntry,
): AppServingLocation {
  return entry.servingLocation ?? defaultServingLocation;
}
