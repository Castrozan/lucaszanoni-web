import { describe, expect, it } from "vitest";
import {
  buildAppRegistryEntry,
  type AppRegistryEntryBuilderInput,
} from "../../src/app-registry/entry-builder";
import { parseAppRegistry } from "../../src/app-registry/parser";
import { AppRegistryValidationError } from "../../src/app-registry/types";

const baseInput: AppRegistryEntryBuilderInput = {
  id: "ledger",
  mountPath: "/finance/ledger/",
  navigationLabel: "Ledger",
  description: "Double-entry ledger service.",
  showInCrossSectionNavigation: true,
  status: "active",
  accessModel: { environment: "public" },
  source: { buildProfile: "static-spa" },
  origin: { kind: "cloudflare-worker" },
};

describe("buildAppRegistryEntry", () => {
  it("derives source and the Worker origin from the id", () => {
    const entry = buildAppRegistryEntry({
      ...baseInput,
      capabilities: ["generative-ai"],
    });
    expect(entry.source).toEqual({
      appPackageName: "@platform/ledger",
      appDirectoryName: "ledger",
      buildProfile: "static-spa",
      publicBuildEnvironment: {},
      publicBuildEnvironmentReferences: {},
    });
    expect(entry.capabilities).toEqual(["generative-ai"]);
    expect(parseAppRegistry([entry])).toEqual([entry]);
    expect(entry.origin).toEqual({
      kind: "cloudflare-worker",
      scriptName: "lucaszanoni-ledger",
    });
  });

  it("preserves explicit public build settings on source", () => {
    const source = {
      buildProfile: "static-spa" as const,
      publicBuildEnvironment: { VITE_MODE: "demo" },
      publicBuildEnvironmentReferences: { NEXT_PUBLIC_API: "API_URL" },
    };
    expect(
      buildAppRegistryEntry({ ...baseInput, source }).source,
    ).toMatchObject(source);
  });

  it("carries the dynamic-service build profile through unchanged", () => {
    const entry = buildAppRegistryEntry({
      ...baseInput,
      source: { buildProfile: "dynamic-service" },
    });
    expect(entry.origin.kind).toBe("cloudflare-worker");
    expect(entry.source?.buildProfile).toBe("dynamic-service");
  });

  it("copies the descriptive fields verbatim", () => {
    const entry = buildAppRegistryEntry(baseInput);
    expect(entry.id).toBe("ledger");
    expect(entry.mountPath).toBe("/finance/ledger/");
    expect(entry.navigationLabel).toBe("Ledger");
    expect(entry.description).toBe("Double-entry ledger service.");
    expect(entry.showInCrossSectionNavigation).toBe(true);
    expect(entry.status).toBe("active");
    expect(entry.accessModel).toEqual({ environment: "public" });
  });

  it("produces an in-repo entry the registry parser accepts and round-trips", () => {
    const entry = buildAppRegistryEntry(baseInput);
    expect(parseAppRegistry([entry])).toEqual([entry]);
  });

  it("builds a private owner access model unchanged", () => {
    const entry = buildAppRegistryEntry({
      ...baseInput,
      accessModel: { environment: "private", audience: { kind: "owner" } },
    });
    expect(entry.accessModel).toEqual({
      environment: "private",
      audience: { kind: "owner" },
    });
    expect(parseAppRegistry([entry])).toEqual([entry]);
  });

  it("passes a private shared access model audience key through", () => {
    const entry = buildAppRegistryEntry({
      ...baseInput,
      accessModel: {
        environment: "private",
        audience: { kind: "shared", audienceKey: "engineering" },
      },
    });
    expect(entry.accessModel).toEqual({
      environment: "private",
      audience: { kind: "shared", audienceKey: "engineering" },
    });
    expect(parseAppRegistry([entry])).toEqual([entry]);
  });

  it("builds an external-https origin and round-trips through the parser", () => {
    const entry = buildAppRegistryEntry({
      ...baseInput,
      id: "status-page",
      mountPath: "/status/",
      accessModel: { environment: "private", audience: { kind: "owner" } },
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
      accessModel: { environment: "public" },
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
      accessModel: { environment: "private", audience: { kind: "owner" } },
      origin: {
        kind: "static-gcs-bucket",
        bucketName: "lucaszanoni-downloads",
        objectKeyPrefix: "",
      },
    });
    expect(() => parseAppRegistry([entry])).toThrow(AppRegistryValidationError);
  });
});
