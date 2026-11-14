import { describe, expect, it } from "vitest";
import Ajv from "ajv";
import appRegistryDocument from "../../src/app-registry.json";
import appRegistrySchema from "../../src/app-registry.schema.json";
import { appRegistry } from "../../src/app-registry";
import type { MicroFrontendId } from "../../src/app-registry";
import { CROSS_SECTION_NAVIGATION_ROUTES } from "../../src/route-registry";
import { todaysApps, shellApp, cockpitApp } from "./test-fixtures";

describe("application registry", () => {
  it("mirrors today's registered apps exactly", () => {
    expect(appRegistry).toEqual(todaysApps);
  });

  it("registers the private owner db app on an external origin and hides it from public navigation", () => {
    const dbApp = appRegistry.find((entry) => entry.id === "db");
    expect(dbApp?.accessModel).toEqual({
      environment: "private",
      audience: { kind: "owner" },
    });
    expect(dbApp?.origin.kind).toBe("external-https");
    expect(dbApp?.showInCrossSectionNavigation).toBe(false);
    expect(
      CROSS_SECTION_NAVIGATION_ROUTES.some((route) => route.id === "db"),
    ).toBe(false);
  });

  it("exposes every mount path with a leading and trailing slash", () => {
    for (const entry of appRegistry) {
      expect(entry.mountPath.startsWith("/")).toBe(true);
      expect(entry.mountPath.endsWith("/")).toBe(true);
    }
  });

  it("registers a unique mount path and id per app", () => {
    const mountPaths = appRegistry.map((entry) => entry.mountPath);
    const ids = appRegistry.map((entry) => entry.id);
    expect(new Set(mountPaths).size).toBe(mountPaths.length);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("exposes the registry id type for every deployed app", () => {
    const knownId: MicroFrontendId = "shell";
    expect(appRegistry.some((entry) => entry.id === knownId)).toBe(true);
  });
});

describe("application registry json schema", () => {
  const ajv = new Ajv({ allErrors: true });
  const validate = ajv.compile(appRegistrySchema);

  it.each([shellApp, cockpitApp])(
    "requires source for repository hosting $origin.kind",
    (entry) => {
      const { source: _source, ...withoutSource } = entry;
      expect(validate([withoutSource])).toBe(false);
    },
  );

  it.each([
    { ...shellApp.source, appDirectoryName: "../shell" },
    { ...shellApp.source, publicBuildEnvironment: undefined },
    { ...shellApp.source, publicBuildEnvironmentReferences: undefined },
    { ...shellApp.source, publicBuildEnvironment: { PRIVATE_KEY: "value" } },
    { ...shellApp.source, publicBuildEnvironmentReferences: { VITE_: "KEY" } },
    { ...shellApp.source, publicBuildEnvironment: { VITE_COUNT: 42 } },
    { ...shellApp.source, buildProfile: "unknown" },
    { ...shellApp.source, scriptName: "misplaced" },
  ])("rejects malformed source %j", (source) => {
    expect(validate([{ ...shellApp, source }])).toBe(false);
  });

  it.each(["appPackageName", "appDirectoryName", "buildProfile"])(
    "rejects source field %s on the target",
    (field) => {
      expect(
        validate([
          { ...shellApp, origin: { ...shellApp.origin, [field]: "obsolete" } },
        ]),
      ).toBe(false);
    },
  );

  it.each(["in-repo-worker-assets"])("rejects obsolete origin %s", (kind) => {
    expect(
      validate([{ ...shellApp, origin: { ...shellApp.origin, kind } }]),
    ).toBe(false);
  });

  it.each(
    ["generative-ai", ["unsupported"], ["generative-ai", "generative-ai"]].map(
      (capabilities) => ({ capabilities }),
    ),
  )("rejects invalid capabilities $capabilities", ({ capabilities }) => {
    expect(validate([{ ...shellApp, capabilities }])).toBe(false);
  });

  it.each(["appPackageName", "appDirectoryName", "buildProfile"])(
    "rejects obsolete Worker target field %s",
    (field) => {
      expect(
        validate([
          {
            ...cockpitApp,
            origin: { ...cockpitApp.origin, [field]: "obsolete" },
          },
        ]),
      ).toBe(false);
    },
  );

  it("accepts an explicit unique AI capability", () => {
    expect(validate([{ ...shellApp, capabilities: ["generative-ai"] }])).toBe(
      true,
    );
  });

  it("accepts the committed registry document", () => {
    expect(validate(appRegistryDocument)).toBe(true);
  });

  it("rejects an entry that omits the access model", () => {
    const [first] = appRegistryDocument;
    const { accessModel: _omitted, ...withoutAccessModel } = first as Record<
      string,
      unknown
    > & { accessModel: unknown };
    expect(validate([withoutAccessModel])).toBe(false);
  });

  it("rejects a static bucket origin paired with a private-environment access model", () => {
    const staticBucketEntry = {
      id: "private-bucket-app",
      mountPath: "/private/bucket/",
      navigationLabel: "Private bucket app",
      description: "An app served directly from a bucket.",
      showInCrossSectionNavigation: false,
      status: "active",
      accessModel: { environment: "private", audience: { kind: "owner" } },
      origin: {
        kind: "static-gcs-bucket",
        bucketName: "some-bucket",
        objectKeyPrefix: "prefix/",
      },
    };
    expect(validate([staticBucketEntry])).toBe(false);
  });
});
