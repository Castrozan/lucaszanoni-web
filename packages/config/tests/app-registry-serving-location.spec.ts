import { describe, expect, it } from "vitest";
import { parseAppRegistry } from "../src/app-registry-parser";
import { resolveServingLocation } from "../src/app-registry-serving-location";
import { AppRegistryValidationError } from "../src/app-registry-types";
import { shellApp } from "./app-registry-test-fixtures";

const baseEntry = shellApp;

describe("parseAppRegistry serving location axis", () => {
  it("leaves servingLocation undefined when the entry omits it", () => {
    const parsed = parseAppRegistry([baseEntry]);
    expect(parsed[0]?.servingLocation).toBeUndefined();
  });

  it("accepts an explicit path-prefix serving location", () => {
    const parsed = parseAppRegistry([
      { ...baseEntry, servingLocation: { kind: "path-prefix" } },
    ]);
    expect(parsed[0]?.servingLocation).toEqual({ kind: "path-prefix" });
  });

  it("accepts a subdomain serving location carrying a dns label", () => {
    const parsed = parseAppRegistry([
      {
        ...baseEntry,
        servingLocation: { kind: "subdomain", subdomainLabel: "ledger" },
      },
    ]);
    expect(parsed[0]?.servingLocation).toEqual({
      kind: "subdomain",
      subdomainLabel: "ledger",
    });
  });

  it("rejects an unknown serving location kind", () => {
    expect(() =>
      parseAppRegistry([
        { ...baseEntry, servingLocation: { kind: "wildcard" } },
      ]),
    ).toThrow(/servingLocation/);
  });

  it("rejects a subdomain serving location without a label", () => {
    expect(() =>
      parseAppRegistry([
        { ...baseEntry, servingLocation: { kind: "subdomain" } },
      ]),
    ).toThrow(/subdomainLabel/);
  });

  it("rejects a subdomain label that is not a dns label", () => {
    expect(() =>
      parseAppRegistry([
        {
          ...baseEntry,
          servingLocation: { kind: "subdomain", subdomainLabel: "Not_A_Label" },
        },
      ]),
    ).toThrow(/subdomainLabel/);
  });

  it("rejects a path-prefix serving location carrying a foreign property", () => {
    expect(() =>
      parseAppRegistry([
        {
          ...baseEntry,
          servingLocation: { kind: "path-prefix", subdomainLabel: "ledger" },
        },
      ]),
    ).toThrow(AppRegistryValidationError);
  });

  it("rejects two subdomain entries that claim the same subdomain label", () => {
    expect(() =>
      parseAppRegistry([
        {
          ...baseEntry,
          servingLocation: { kind: "subdomain", subdomainLabel: "ledger" },
        },
        {
          ...baseEntry,
          id: "ledger-clone",
          mountPath: "/ledger-clone/",
          servingLocation: { kind: "subdomain", subdomainLabel: "ledger" },
          origin: {
            ...baseEntry.origin,
            cloudRunServiceName: "lucaszanoni-ledger-clone",
            appDirectoryName: "ledger-clone",
          },
        },
      ]),
    ).toThrow(/subdomainLabel/);
  });
});

describe("resolveServingLocation", () => {
  it("defaults an entry without a serving location to path-prefix", () => {
    expect(resolveServingLocation(shellApp)).toEqual({ kind: "path-prefix" });
  });

  it("returns an explicit path-prefix serving location unchanged", () => {
    expect(
      resolveServingLocation({
        ...shellApp,
        servingLocation: { kind: "path-prefix" },
      }),
    ).toEqual({ kind: "path-prefix" });
  });

  it("returns an explicit subdomain serving location unchanged", () => {
    expect(
      resolveServingLocation({
        ...shellApp,
        servingLocation: { kind: "subdomain", subdomainLabel: "ledger" },
      }),
    ).toEqual({ kind: "subdomain", subdomainLabel: "ledger" });
  });
});
