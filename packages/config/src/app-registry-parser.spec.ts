import { describe, expect, it } from "vitest";
import appRegistryDocument from "./app-registry.json";
import { parseAppRegistry } from "./app-registry-parser";
import { AppRegistryValidationError } from "./app-registry-types";
import { shellApp } from "./app-registry-test-fixtures";

describe("parseAppRegistry", () => {
  const baseEntry = shellApp;

  it("accepts the committed registry document", () => {
    expect(() => parseAppRegistry(appRegistryDocument)).not.toThrow();
  });

  it("rejects a non-array document", () => {
    expect(() => parseAppRegistry({})).toThrow(AppRegistryValidationError);
  });

  it("rejects a missing access model", () => {
    const { accessModel: _omitted, ...withoutAccessModel } = baseEntry;
    expect(() => parseAppRegistry([withoutAccessModel])).toThrow(
      AppRegistryValidationError,
    );
  });

  it("rejects an unknown access model kind", () => {
    expect(() =>
      parseAppRegistry([{ ...baseEntry, accessModel: { kind: "everyone" } }]),
    ).toThrow(AppRegistryValidationError);
  });

  it("rejects a shared access model without an audience key", () => {
    expect(() =>
      parseAppRegistry([{ ...baseEntry, accessModel: { kind: "shared" } }]),
    ).toThrow(/audienceKey/);
  });

  it("rejects a mount path without a trailing slash", () => {
    expect(() =>
      parseAppRegistry([{ ...baseEntry, mountPath: "/no-trailing-slash" }]),
    ).toThrow(/mountPath/);
  });

  it("rejects duplicate ids", () => {
    expect(() => parseAppRegistry([baseEntry, baseEntry])).toThrow(/id/);
  });

  it("rejects duplicate mount paths", () => {
    expect(() =>
      parseAppRegistry([baseEntry, { ...baseEntry, id: "shell-clone" }]),
    ).toThrow(/mountPath/);
  });

  it("rejects an unknown origin kind", () => {
    expect(() =>
      parseAppRegistry([{ ...baseEntry, origin: { kind: "carrier-pigeon" } }]),
    ).toThrow(AppRegistryValidationError);
  });

  it("rejects a non-public static bucket origin", () => {
    expect(() =>
      parseAppRegistry([
        {
          ...baseEntry,
          accessModel: { kind: "owner-only" },
          origin: {
            kind: "static-gcs-bucket",
            bucketName: "some-bucket",
            objectKeyPrefix: "prefix/",
          },
        },
      ]),
    ).toThrow(AppRegistryValidationError);
  });

  it("rejects an entry carrying an unexpected property", () => {
    expect(() => parseAppRegistry([{ ...baseEntry, surprise: true }])).toThrow(
      AppRegistryValidationError,
    );
  });

  it("rejects an access model carrying a foreign property", () => {
    expect(() =>
      parseAppRegistry([
        { ...baseEntry, accessModel: { kind: "public", audienceKey: "x" } },
      ]),
    ).toThrow(AppRegistryValidationError);
  });

  it("rejects an origin carrying a property from another variant", () => {
    expect(() =>
      parseAppRegistry([
        {
          ...baseEntry,
          origin: { ...baseEntry.origin, bucketName: "stray-bucket" },
        },
      ]),
    ).toThrow(AppRegistryValidationError);
  });

  it("accepts an external-https origin with an empty forwarded base path", () => {
    expect(() =>
      parseAppRegistry([
        {
          ...baseEntry,
          origin: {
            kind: "external-https",
            originHost: "app.example.com",
            pathRewrite: "preserve",
            forwardedBasePath: "",
            trusted: true,
          },
        },
      ]),
    ).not.toThrow();
  });

  it("accepts a static bucket origin with an empty object key prefix", () => {
    expect(() =>
      parseAppRegistry([
        {
          ...baseEntry,
          origin: {
            kind: "static-gcs-bucket",
            bucketName: "some-bucket",
            objectKeyPrefix: "",
          },
        },
      ]),
    ).not.toThrow();
  });
});
