import { describe, expect, it } from "vitest";
import { parseAppRegistry } from "../../src/app-registry/parser";
import { AppRegistryValidationError } from "../../src/app-registry/types";
import type { AppRegistryEntry } from "../../src/app-registry/types";
import { cockpitApp, shellApp } from "./test-fixtures";

const cloudRunShellApp: AppRegistryEntry = {
  ...shellApp,
  origin: {
    kind: "cloud-run",
    cloudRunServiceName: "lucaszanoni-shell",
    nonSecretEnvironment: {},
    secretEnvironmentReferences: {},
  },
};

describe("Worker static assets", () => {
  it("preserves the private owner policy without a Cloud Run origin", () => {
    const [application] = parseAppRegistry([cockpitApp]);
    expect(application?.origin).toEqual({
      kind: "cloudflare-worker",
      scriptName: "lucaszanoni-cockpit",
    });
    expect(application?.accessModel).toEqual({
      environment: "private",
      audience: { kind: "owner" },
    });
  });

  it("rejects obsolete Cloud Run fields on an asset origin", () => {
    expect(() =>
      parseAppRegistry([
        {
          ...cockpitApp,
          origin: { ...cockpitApp.origin, cloudRunServiceName: "obsolete" },
        },
      ]),
    ).toThrow(/cloudRunServiceName/);
  });

  it("rejects duplicate source directories across hosting providers", () => {
    expect(cloudRunShellApp.origin.kind).not.toBe(cockpitApp.origin.kind);
    expect(() =>
      parseAppRegistry([
        cloudRunShellApp,
        {
          ...cockpitApp,
          source: { ...shellApp.source },
        },
      ]),
    ).toThrow(/appDirectoryName/);
  });
});

describe("source-independent registry contract", () => {
  it.each(["cloud-run", "cloudflare-worker"] as const)(
    "requires source for %s",
    (kind) => {
      const application = kind === "cloud-run" ? cloudRunShellApp : cockpitApp;
      expect(application.origin.kind).toBe(kind);
      const { source: _source, ...entry } = application;
      expect(() => parseAppRegistry([entry])).toThrow(
        /requires repository source/,
      );
    },
  );

  it.each(
    [
      null,
      [],
      {},
      { ...shellApp.source, appPackageName: "" },
      { ...shellApp.source, appDirectoryName: "../shell" },
      { ...shellApp.source, appDirectoryName: "nested/shell" },
      { ...shellApp.source, appDirectoryName: "Shell" },
      { ...shellApp.source, buildProfile: "unknown" },
      { ...shellApp.source, publicBuildEnvironment: undefined },
      { ...shellApp.source, publicBuildEnvironmentReferences: undefined },
      { ...shellApp.source, publicBuildEnvironment: { PRIVATE_KEY: "value" } },
      {
        ...shellApp.source,
        publicBuildEnvironmentReferences: { VITE_: "KEY" },
      },
      { ...shellApp.source, publicBuildEnvironment: { VITE_COUNT: 42 } },
      {
        ...shellApp.source,
        publicBuildEnvironmentReferences: { NEXT_PUBLIC_KEY: 42 },
      },
      { ...shellApp.source, cloudRunServiceName: "misplaced" },
    ].map((source) => ({ source })),
  )("rejects malformed source $source", ({ source }) => {
    expect(() => parseAppRegistry([{ ...shellApp, source }])).toThrow(
      AppRegistryValidationError,
    );
  });

  it.each(
    ["generative-ai", ["unsupported"], ["generative-ai", "generative-ai"]].map(
      (capabilities) => ({ capabilities }),
    ),
  )("rejects malformed capabilities $capabilities", ({ capabilities }) => {
    expect(() => parseAppRegistry([{ ...shellApp, capabilities }])).toThrow(
      /capabilities/,
    );
  });

  it.each(["in-repo-cloud-run", "in-repo-worker-assets"])(
    "rejects obsolete origin %s",
    (kind) => {
      expect(() =>
        parseAppRegistry([
          { ...shellApp, origin: { ...shellApp.origin, kind } },
        ]),
      ).toThrow(/kind/);
    },
  );

  it.each(["appPackageName", "appDirectoryName", "buildProfile"])(
    "rejects source field %s on the target",
    (field) => {
      expect(() =>
        parseAppRegistry([
          { ...shellApp, origin: { ...shellApp.origin, [field]: "obsolete" } },
        ]),
      ).toThrow(field);
    },
  );

  it("rejects duplicate Worker script names", () => {
    expect(() =>
      parseAppRegistry([
        cockpitApp,
        {
          ...cockpitApp,
          id: "cockpit-clone",
          mountPath: "/cockpit-clone/",
          source: { ...cockpitApp.source, appDirectoryName: "cockpit-clone" },
        },
      ]),
    ).toThrow(/scriptName/);
  });

  it("preserves source and capabilities across a hosting provider swap", () => {
    const [original] = parseAppRegistry([
      { ...cloudRunShellApp, capabilities: ["generative-ai"] },
    ]);
    const [swapped] = parseAppRegistry([
      {
        ...original,
        origin: { kind: "cloudflare-worker", scriptName: "lucaszanoni-shell" },
      },
    ]);
    expect(swapped?.origin.kind).not.toBe(original?.origin.kind);
    expect(swapped?.source).toEqual(original?.source);
    expect(swapped?.capabilities).toEqual(original?.capabilities);
  });
});
