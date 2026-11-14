import { describe, expect, it } from "vitest";
import { parseAppRegistry } from "../../src/app-registry/parser";
import { AppRegistryValidationError } from "../../src/app-registry/types";
import { shellApp } from "./test-fixtures";

describe("parseAppRegistry origin variants", () => {
  const baseEntry = shellApp;

  it.each(["carrier-pigeon", "static-gcs-bucket"])(
    "rejects the unknown origin kind %s",
    (kind) => {
      expect(() =>
        parseAppRegistry([{ ...baseEntry, origin: { kind } }]),
      ).toThrow(AppRegistryValidationError);
    },
  );

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
