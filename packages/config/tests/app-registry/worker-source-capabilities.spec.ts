import { describe, expect, it } from "vitest";
import Ajv from "ajv";
import appRegistrySchema from "../../src/app-registry.schema.json";
import { createDeploymentManifest } from "../../src/app-registry/deployment-manifest";
import { parseAppRegistry } from "../../src/app-registry/parser";
import type {
  AppCapability,
  AppRegistryEntry,
  AppSource,
} from "../../src/app-registry/types";
import { shellApp } from "./test-fixtures";
import {
  APP_BUILD_PROFILES,
  APP_CAPABILITIES,
} from "../../src/app-registry/types";

const supportedCapabilities = APP_CAPABILITIES;
const validateRegistry = new Ajv({ allErrors: true }).compile(
  appRegistrySchema,
);

function orderedSubsets(values: readonly AppCapability[]): AppCapability[][] {
  return [
    [],
    ...values.flatMap((value) =>
      orderedSubsets(values.filter((candidate) => candidate !== value)).map(
        (rest) => [value, ...rest],
      ),
    ),
  ];
}

const workerSource: AppSource = {
  appPackageName: "@platform/snapshot-worker",
  appDirectoryName: "snapshot-worker",
  buildProfile: "worker-service",
  publicBuildEnvironment: {},
  publicBuildEnvironmentReferences: {},
};

function workerApplication(
  capabilities?: readonly AppCapability[],
): AppRegistryEntry {
  return {
    id: "snapshot-worker",
    mountPath: "/snapshot-worker/",
    navigationLabel: "Snapshot worker",
    description: "Private snapshot worker.",
    showInCrossSectionNavigation: false,
    status: "active",
    accessModel: { environment: "private", audience: { kind: "owner" } },
    source: workerSource,
    origin: {
      kind: "cloudflare-worker",
      scriptName: "lucaszanoni-snapshot-worker",
    },
    ...(capabilities === undefined ? {} : { capabilities }),
  };
}

function parseWithCapabilities(capabilities: unknown) {
  return parseAppRegistry([{ ...shellApp, capabilities }]);
}

describe("worker-service build profile", () => {
  it("accepts worker-service as a source build profile", () => {
    const [application] = parseAppRegistry([
      {
        ...shellApp,
        source: { ...workerSource, buildProfile: "worker-service" },
      },
    ]);
    expect(application?.source?.buildProfile).toBe("worker-service");
    expect(validateRegistry([workerApplication()])).toBe(true);
    expect(
      appRegistrySchema.definitions.source.properties.buildProfile.enum,
    ).toEqual(APP_BUILD_PROFILES);
  });

  it.each(APP_BUILD_PROFILES)(
    "keeps %s as a source build profile",
    (buildProfile) => {
      const [application] = parseAppRegistry([
        { ...shellApp, source: { ...shellApp.source, buildProfile } },
      ]);
      expect(application?.source?.buildProfile).toBe(buildProfile);
    },
  );

  it("rejects an unknown source build profile", () => {
    expect(() =>
      parseAppRegistry([
        {
          ...shellApp,
          source: { ...shellApp.source, buildProfile: "fetch-service" },
        },
      ]),
    ).toThrow(/buildProfile/);
  });
});

describe("capability parsing", () => {
  it("keeps the published schema aligned with supported capabilities", () => {
    expect(
      appRegistrySchema.definitions.appRegistryEntry.properties.capabilities
        .items.enum,
    ).toEqual(APP_CAPABILITIES);
  });
  it.each(
    orderedSubsets(supportedCapabilities).map((capabilities) => ({
      capabilities,
    })),
  )("preserves declared capabilities $capabilities", ({ capabilities }) => {
    const [application] = parseWithCapabilities(capabilities);
    expect(application?.capabilities).toEqual(capabilities);
  });

  it("keeps an explicitly empty capability list distinct from omission", () => {
    const [declaredEmpty] = parseWithCapabilities([]);
    const [omitted] = parseAppRegistry([shellApp]);
    expect(declaredEmpty?.capabilities).toEqual([]);
    expect(omitted?.capabilities).toBeUndefined();
  });

  it.each(
    orderedSubsets(supportedCapabilities)
      .filter((capabilities) => capabilities.length > 0)
      .map((capabilities) => ({
        capabilities: [...capabilities, capabilities[0]],
      })),
  )("rejects duplicate capabilities $capabilities", ({ capabilities }) => {
    expect(() => parseWithCapabilities(capabilities)).toThrow(/capabilities/);
  });

  it.each(
    orderedSubsets(supportedCapabilities).flatMap((capabilities) => [
      { capabilities: ["unsupported-capability", ...capabilities] },
      { capabilities: [...capabilities, "unsupported-capability"] },
    ]),
  )("rejects unknown capabilities $capabilities", ({ capabilities }) => {
    expect(() => parseWithCapabilities(capabilities)).toThrow(/capabilities/);
  });

  it.each([{ value: "generative-ai" }, { value: null }, { value: {} }])(
    "rejects a non-array capabilities value $value",
    ({ value }) => {
      expect(() => parseWithCapabilities(value)).toThrow(/capabilities/);
    },
  );
});

describe("deployment manifest capability projection", () => {
  it("projects every finite capability subset in declared order without mutating the registry", () => {
    for (const capabilities of orderedSubsets(supportedCapabilities)) {
      const registry = [workerApplication(capabilities)];
      const snapshot = structuredClone(registry);
      const [application] = createDeploymentManifest(registry).applications;
      expect(application?.capabilities).toEqual(capabilities);
      expect(validateRegistry(registry)).toBe(true);
      expect(registry).toEqual(snapshot);
    }
  });

  it("keeps an explicitly empty declaration as an empty array", () => {
    const [application] = createDeploymentManifest([
      workerApplication([]),
    ]).applications;
    expect(Object.hasOwn(application ?? {}, "capabilities")).toBe(true);
    expect(application?.capabilities).toEqual([]);
  });

  it("omits the capabilities property when the registry did not declare it", () => {
    const [application] = createDeploymentManifest([
      workerApplication(),
    ]).applications;
    expect(Object.hasOwn(application ?? {}, "capabilities")).toBe(false);
  });

  it("projects worker-service with unchanged target, access and serving fields", () => {
    const [application] = createDeploymentManifest([
      workerApplication(["snapshot-ingestion", "snapshot-data"]),
    ]).applications;
    expect(application).toMatchObject({
      applicationId: "snapshot-worker",
      mountPath: "/snapshot-worker/",
      servingLocation: { kind: "path-prefix" },
      source: workerSource,
      accessModel: { environment: "private", audience: { kind: "owner" } },
      target: {
        kind: "cloudflare-worker",
        scriptName: "lucaszanoni-snapshot-worker",
      },
      capabilities: ["snapshot-ingestion", "snapshot-data"],
    });
  });
});
