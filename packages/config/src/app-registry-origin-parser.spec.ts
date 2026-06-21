import { describe, expect, it } from "vitest";
import { parseAppRegistry } from "./app-registry-parser";
import { AppRegistryValidationError } from "./app-registry-types";
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

  it("surfaces an in-repo origin's non-secret environment map", () => {
    const [entry] = parseAppRegistry([
      {
        ...baseEntry,
        origin: {
          kind: "in-repo-cloud-run",
          cloudRunServiceName: "lucaszanoni-shell",
          appPackageName: "@lucaszanoni-web/shell",
          appDirectoryName: "shell",
          buildProfile: "static-spa",
          nonSecretEnvironment: {
            PUBLIC_API_BASE_URL: "https://api.example.com",
          },
        },
      },
    ]);
    expect(entry?.origin).toMatchObject({
      nonSecretEnvironment: {
        PUBLIC_API_BASE_URL: "https://api.example.com",
      },
    });
  });

  it("accepts an in-repo origin with an empty non-secret environment map", () => {
    expect(() =>
      parseAppRegistry([
        {
          ...baseEntry,
          origin: {
            kind: "in-repo-cloud-run",
            cloudRunServiceName: "lucaszanoni-shell",
            appPackageName: "@lucaszanoni-web/shell",
            appDirectoryName: "shell",
            buildProfile: "static-spa",
            nonSecretEnvironment: {},
          },
        },
      ]),
    ).not.toThrow();
  });

  it("rejects an in-repo non-secret environment map carrying a non-string value", () => {
    expect(() =>
      parseAppRegistry([
        {
          ...baseEntry,
          origin: {
            kind: "in-repo-cloud-run",
            cloudRunServiceName: "lucaszanoni-shell",
            appPackageName: "@lucaszanoni-web/shell",
            appDirectoryName: "shell",
            buildProfile: "static-spa",
            nonSecretEnvironment: { MAX_RETRIES: 5 },
          },
        },
      ]),
    ).toThrow(/value for MAX_RETRIES must be a string/);
  });

  it("rejects an in-repo origin missing the non-secret environment map", () => {
    expect(() =>
      parseAppRegistry([
        {
          ...baseEntry,
          origin: {
            kind: "in-repo-cloud-run",
            cloudRunServiceName: "lucaszanoni-shell",
            appPackageName: "@lucaszanoni-web/shell",
            appDirectoryName: "shell",
            buildProfile: "static-spa",
          },
        },
      ]),
    ).toThrow(/nonSecretEnvironment/);
  });
});
