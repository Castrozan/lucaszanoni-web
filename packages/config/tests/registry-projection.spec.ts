import { describe, expect, it } from "vitest";
import { appRegistry } from "../src/app-registry";
import {
  CROSS_SECTION_NAVIGATION_ROUTES,
  MICRO_FRONTEND_ROUTES,
} from "../src/route-registry";
import {
  COCKPIT_MOUNT_PATH,
  REPORTS_MOUNT_PATH,
  SHELL_MOUNT_PATH,
  USAGE_DASHBOARD_MOUNT_PATH,
} from "../src/mount-paths";

function registryEntryForId(id: string) {
  return appRegistry.find((entry) => entry.id === id);
}

describe("registry projection", () => {
  it("projects one route per registry entry preserving registry order", () => {
    expect(MICRO_FRONTEND_ROUTES.map((route) => route.id)).toEqual(
      appRegistry.map((entry) => entry.id),
    );
  });

  it("carries each registry entry's fields onto its projected route", () => {
    for (const entry of appRegistry) {
      const route = registryEntryForId(entry.id);
      const projected = MICRO_FRONTEND_ROUTES.find(
        (candidate) => candidate.id === entry.id,
      );
      expect(projected?.navigationLabel).toBe(route?.navigationLabel);
      expect(projected?.description).toBe(route?.description);
      expect(projected?.mountPath).toBe(route?.mountPath);
      expect(projected?.accessModel).toEqual(entry.accessModel);
      expect(projected?.origin).toEqual(entry.origin);
    }
  });

  it("derives cross-section navigation from the registry flag and public access", () => {
    expect(CROSS_SECTION_NAVIGATION_ROUTES.map((route) => route.id)).toEqual(
      appRegistry
        .filter(
          (entry) =>
            entry.showInCrossSectionNavigation &&
            entry.accessModel.kind === "public",
        )
        .map((entry) => entry.id),
    );
  });

  it("derives the named mount path constants from the registry", () => {
    expect(SHELL_MOUNT_PATH).toBe(registryEntryForId("shell")?.mountPath);
    expect(USAGE_DASHBOARD_MOUNT_PATH).toBe(
      registryEntryForId("usage-dashboard")?.mountPath,
    );
    expect(REPORTS_MOUNT_PATH).toBe(registryEntryForId("reports")?.mountPath);
    expect(COCKPIT_MOUNT_PATH).toBe(registryEntryForId("cockpit")?.mountPath);
  });
});
