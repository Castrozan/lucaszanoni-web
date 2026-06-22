import { describe, expect, it } from "vitest";
import { parseAppRegistry } from "../src/app-registry-parser";
import { AppRegistryValidationError } from "../src/app-registry-types";
import {
  cockpitApp,
  jarvisSessionApp,
  shellApp,
} from "./app-registry-test-fixtures";

describe("parseAppRegistry accessApplicationProvisioning", () => {
  const baseEntry = shellApp;

  it("leaves accessApplicationProvisioning undefined when the entry omits it", () => {
    const parsed = parseAppRegistry([baseEntry]);
    expect(parsed[0]?.accessApplicationProvisioning).toBeUndefined();
  });

  it("accepts and exposes a dedicated provisioning", () => {
    const parsed = parseAppRegistry([
      { ...baseEntry, accessApplicationProvisioning: { kind: "dedicated" } },
    ]);
    expect(parsed[0]?.accessApplicationProvisioning).toEqual({
      kind: "dedicated",
    });
  });

  it("accepts a child inheriting its access application from a non-public dedicated parent", () => {
    const parsed = parseAppRegistry([cockpitApp, jarvisSessionApp]);
    expect(parsed[1]?.accessApplicationProvisioning).toEqual({
      kind: "inherited-from-parent-path",
      parentMountPath: "/cockpit/",
    });
  });

  it("rejects an unknown provisioning kind", () => {
    expect(() =>
      parseAppRegistry([
        {
          ...baseEntry,
          accessApplicationProvisioning: { kind: "borrowed" },
        },
      ]),
    ).toThrow(AppRegistryValidationError);
  });

  it("rejects an inherited provisioning whose parentMountPath lacks slashes", () => {
    expect(() =>
      parseAppRegistry([
        {
          ...baseEntry,
          accessApplicationProvisioning: {
            kind: "inherited-from-parent-path",
            parentMountPath: "cockpit",
          },
        },
      ]),
    ).toThrow(/parentMountPath/);
  });

  it("rejects an inherited provisioning carrying a foreign property", () => {
    expect(() =>
      parseAppRegistry([
        {
          ...baseEntry,
          accessApplicationProvisioning: {
            kind: "inherited-from-parent-path",
            parentMountPath: "/cockpit/",
            surprise: true,
          },
        },
      ]),
    ).toThrow(AppRegistryValidationError);
  });

  it("rejects an inheritance whose parent path is not a strict prefix of the mount path", () => {
    expect(() =>
      parseAppRegistry([
        {
          ...cockpitApp,
          accessApplicationProvisioning: {
            kind: "inherited-from-parent-path",
            parentMountPath: "/cockpit/",
          },
        },
      ]),
    ).toThrow(/strict path prefix/);
  });

  it("rejects an inheritance from a parent path with no app mounted there", () => {
    expect(() => parseAppRegistry([jarvisSessionApp])).toThrow(
      /no app is mounted there/,
    );
  });

  it("rejects an inheritance from a public parent that would leave it ungated", () => {
    expect(() =>
      parseAppRegistry([
        { ...cockpitApp, accessModel: { kind: "public" } },
        jarvisSessionApp,
      ]),
    ).toThrow(/ungated/);
  });

  it("rejects an inheritance from a parent that does not own a dedicated access application", () => {
    expect(() =>
      parseAppRegistry([
        { ...shellApp, accessModel: { kind: "owner-only" } },
        {
          ...cockpitApp,
          accessApplicationProvisioning: {
            kind: "inherited-from-parent-path",
            parentMountPath: "/",
          },
        },
        jarvisSessionApp,
      ]),
    ).toThrow(/dedicated access application/);
  });
});
