import { describe, expect, it } from "vitest";
import {
  buildAppRegistryEntry,
  type AppRegistryEntryBuilderInput,
} from "../src/app-registry-entry-builder";
import { parseAppRegistry } from "../src/app-registry-parser";
import { AppRegistryValidationError } from "../src/app-registry-types";

const baseInput: AppRegistryEntryBuilderInput = {
  id: "ledger",
  mountPath: "/finance/ledger/",
  navigationLabel: "Ledger",
  description: "Double-entry ledger service.",
  showInCrossSectionNavigation: true,
  status: "active",
  accessModel: { kind: "public" },
  origin: { kind: "in-repo-cloud-run", buildProfile: "static-spa" },
};

describe("buildAppRegistryEntry", () => {
  it("derives the in-repo cloud run origin fields from the id", () => {
    const entry = buildAppRegistryEntry(baseInput);
    expect(entry.origin).toEqual({
      kind: "in-repo-cloud-run",
      cloudRunServiceName: "lucaszanoni-ledger",
      appPackageName: "@lucaszanoni-web/ledger",
      appDirectoryName: "ledger",
      buildProfile: "static-spa",
      nonSecretEnvironment: {},
      secretEnvironmentReferences: {},
    });
  });

  it("carries the dynamic-service build profile through unchanged", () => {
    const entry = buildAppRegistryEntry({
      ...baseInput,
      origin: { kind: "in-repo-cloud-run", buildProfile: "dynamic-service" },
    });
    expect(entry.origin.kind).toBe("in-repo-cloud-run");
    if (entry.origin.kind === "in-repo-cloud-run") {
      expect(entry.origin.buildProfile).toBe("dynamic-service");
    }
  });

  it("copies the descriptive fields verbatim", () => {
    const entry = buildAppRegistryEntry(baseInput);
    expect(entry.id).toBe("ledger");
    expect(entry.mountPath).toBe("/finance/ledger/");
    expect(entry.navigationLabel).toBe("Ledger");
    expect(entry.description).toBe("Double-entry ledger service.");
    expect(entry.showInCrossSectionNavigation).toBe(true);
    expect(entry.status).toBe("active");
    expect(entry.accessModel).toEqual({ kind: "public" });
  });

  it("produces an in-repo entry the registry parser accepts and round-trips", () => {
    const entry = buildAppRegistryEntry(baseInput);
    expect(parseAppRegistry([entry])).toEqual([entry]);
  });

  it("builds an owner-only access model unchanged", () => {
    const entry = buildAppRegistryEntry({
      ...baseInput,
      accessModel: { kind: "owner-only" },
    });
    expect(entry.accessModel).toEqual({ kind: "owner-only" });
    expect(parseAppRegistry([entry])).toEqual([entry]);
  });

  it("passes a shared access model audience key through", () => {
    const entry = buildAppRegistryEntry({
      ...baseInput,
      accessModel: { kind: "shared", audienceKey: "engineering" },
    });
    expect(entry.accessModel).toEqual({
      kind: "shared",
      audienceKey: "engineering",
    });
    expect(parseAppRegistry([entry])).toEqual([entry]);
  });

  it("builds an external-https origin and round-trips through the parser", () => {
    const entry = buildAppRegistryEntry({
      ...baseInput,
      id: "status-page",
      mountPath: "/status/",
      accessModel: { kind: "owner-only" },
      origin: {
        kind: "external-https",
        originHost: "status.example.test",
        pathRewrite: "strip-mount-path",
        forwardedBasePath: "/status/",
        trusted: true,
      },
    });
    expect(entry.origin).toEqual({
      kind: "external-https",
      originHost: "status.example.test",
      pathRewrite: "strip-mount-path",
      forwardedBasePath: "/status/",
      trusted: true,
    });
    expect(parseAppRegistry([entry])).toEqual([entry]);
  });

  it("builds a static-gcs-bucket origin and round-trips through the parser", () => {
    const entry = buildAppRegistryEntry({
      ...baseInput,
      id: "downloads",
      mountPath: "/downloads/",
      accessModel: { kind: "public" },
      origin: {
        kind: "static-gcs-bucket",
        bucketName: "lucaszanoni-downloads",
        objectKeyPrefix: "public/",
      },
    });
    expect(entry.origin).toEqual({
      kind: "static-gcs-bucket",
      bucketName: "lucaszanoni-downloads",
      objectKeyPrefix: "public/",
    });
    expect(parseAppRegistry([entry])).toEqual([entry]);
  });

  it("does not coerce the access model, so the parser still rejects a gated static bucket", () => {
    const entry = buildAppRegistryEntry({
      ...baseInput,
      id: "downloads",
      mountPath: "/downloads/",
      accessModel: { kind: "owner-only" },
      origin: {
        kind: "static-gcs-bucket",
        bucketName: "lucaszanoni-downloads",
        objectKeyPrefix: "",
      },
    });
    expect(() => parseAppRegistry([entry])).toThrow(AppRegistryValidationError);
  });
});
