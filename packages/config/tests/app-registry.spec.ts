import { describe, expect, it } from "vitest";
import Ajv from "ajv";
import appRegistryDocument from "../src/app-registry.json";
import appRegistrySchema from "../src/app-registry.schema.json";
import { appRegistry } from "../src/app-registry";
import type { MicroFrontendId } from "../src/app-registry";
import { CROSS_SECTION_NAVIGATION_ROUTES } from "../src/route-registry";
import { todaysApps } from "./app-registry-test-fixtures";

describe("application registry", () => {
  it("mirrors today's registered apps exactly", () => {
    expect(appRegistry).toEqual(todaysApps);
  });

  it("registers the owner-only db app on an external origin and hides it from public navigation", () => {
    const dbApp = appRegistry.find((entry) => entry.id === "db");
    expect(dbApp?.accessModel).toEqual({ kind: "owner-only" });
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

  it("rejects a static bucket origin paired with a non-public access model", () => {
    const staticBucketEntry = {
      id: "private-bucket-app",
      mountPath: "/private/bucket/",
      navigationLabel: "Private bucket app",
      description: "An app served directly from a bucket.",
      showInCrossSectionNavigation: false,
      status: "active",
      accessModel: { kind: "owner-only" },
      origin: {
        kind: "static-gcs-bucket",
        bucketName: "some-bucket",
        objectKeyPrefix: "prefix/",
      },
    };
    expect(validate([staticBucketEntry])).toBe(false);
  });
});
