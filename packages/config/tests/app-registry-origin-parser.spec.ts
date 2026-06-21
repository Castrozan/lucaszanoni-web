import { describe, expect, it } from "vitest";
import { parseAppRegistry } from "../src/app-registry-parser";
import { AppRegistryValidationError } from "../src/app-registry-types";
import { shellApp } from "./app-registry-test-fixtures";

describe("parseAppRegistry origin variants", () => {
  const baseEntry = shellApp;

  it("rejects an unknown origin kind", () => {
    expect(() =>
      parseAppRegistry([{ ...baseEntry, origin: { kind: "carrier-pigeon" } }]),
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

  it("accepts an external-https origin with a multi-segment forwarded base path", () => {
    expect(() =>
      parseAppRegistry([
        {
          ...baseEntry,
          origin: {
            kind: "external-https",
            originHost: "app.example.com",
            pathRewrite: "strip-mount-path",
            forwardedBasePath: "/api/",
            trusted: true,
          },
        },
      ]),
    ).not.toThrow();
  });

  it("rejects an external-https forwarded base path missing a trailing slash", () => {
    expect(() =>
      parseAppRegistry([
        {
          ...baseEntry,
          origin: {
            kind: "external-https",
            originHost: "app.example.com",
            pathRewrite: "strip-mount-path",
            forwardedBasePath: "/api",
            trusted: true,
          },
        },
      ]),
    ).toThrow(/forwardedBasePath/);
  });

  it("rejects an external-https origin host carrying a port or scheme", () => {
    expect(() =>
      parseAppRegistry([
        {
          ...baseEntry,
          origin: {
            kind: "external-https",
            originHost: "app.example.com:8443",
            pathRewrite: "preserve",
            forwardedBasePath: "",
            trusted: true,
          },
        },
      ]),
    ).toThrow(/originHost/);
  });
});
