import { describe, expect, it } from "vitest";
import { parseAppRegistry } from "./app-registry-parser";
import { shellApp } from "./app-registry-test-fixtures";

describe("parseAppRegistry in-repo origin environment", () => {
  const baseEntry = shellApp;

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
          secretEnvironmentReferences: {},
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
            secretEnvironmentReferences: {},
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
            secretEnvironmentReferences: {},
          },
        },
      ]),
    ).toThrow(/nonSecretEnvironment/);
  });

  it("surfaces an in-repo origin's secret environment references", () => {
    const [entry] = parseAppRegistry([
      {
        ...baseEntry,
        origin: {
          kind: "in-repo-cloud-run",
          cloudRunServiceName: "lucaszanoni-shell",
          appPackageName: "@lucaszanoni-web/shell",
          appDirectoryName: "shell",
          buildProfile: "static-spa",
          nonSecretEnvironment: {},
          secretEnvironmentReferences: {
            DATABASE_URL: "lucaszanoni-db-url",
          },
        },
      },
    ]);
    expect(entry?.origin).toMatchObject({
      secretEnvironmentReferences: {
        DATABASE_URL: "lucaszanoni-db-url",
      },
    });
  });

  it("accepts an in-repo origin with empty secret environment references", () => {
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
            secretEnvironmentReferences: {},
          },
        },
      ]),
    ).not.toThrow();
  });

  it("rejects an in-repo secret environment reference carrying a non-string value", () => {
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
            secretEnvironmentReferences: { DATABASE_URL: 5 },
          },
        },
      ]),
    ).toThrow(/value for DATABASE_URL must be a string/);
  });

  it("rejects an in-repo origin missing the secret environment references", () => {
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
    ).toThrow(/secretEnvironmentReferences/);
  });
});
