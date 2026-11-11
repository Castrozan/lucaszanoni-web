import { describe, expect, it } from "vitest";
import appRegistryDocument from "../../src/app-registry.json";
import { parseAppRegistry } from "../../src/app-registry/parser";
import { AppRegistryValidationError } from "../../src/app-registry/types";
import { cockpitApp, shellApp } from "./test-fixtures";

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
    expect(() =>
      parseAppRegistry([
        shellApp,
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
      const { source: _source, ...entry } =
        kind === "cloud-run" ? shellApp : cockpitApp;
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
      { ...shellApp, capabilities: ["generative-ai"] },
    ]);
    const [swapped] = parseAppRegistry([
      {
        ...original,
        origin: { kind: "cloudflare-worker", scriptName: "lucaszanoni-shell" },
      },
    ]);
    expect(swapped?.source).toEqual(original?.source);
    expect(swapped?.capabilities).toEqual(original?.capabilities);
  });
});

describe("parseAppRegistry", () => {
  const baseEntry = shellApp;

  it("accepts the committed registry document", () => {
    expect(() => parseAppRegistry(appRegistryDocument)).not.toThrow();
  });

  it("rejects a non-array document", () => {
    expect(() => parseAppRegistry({})).toThrow(AppRegistryValidationError);
  });

  it("rejects a missing access model", () => {
    const { accessModel: _omitted, ...withoutAccessModel } = baseEntry;
    expect(() => parseAppRegistry([withoutAccessModel])).toThrow(
      AppRegistryValidationError,
    );
  });

  it("rejects an unknown access environment", () => {
    expect(() =>
      parseAppRegistry([
        { ...baseEntry, accessModel: { environment: "everyone" } },
      ]),
    ).toThrow(AppRegistryValidationError);
  });

  it("rejects a private shared audience without an audience key", () => {
    expect(() =>
      parseAppRegistry([
        {
          ...baseEntry,
          accessModel: {
            environment: "private",
            audience: { kind: "shared" },
          },
        },
      ]),
    ).toThrow(/audienceKey/);
  });

  it("rejects a mount path without a trailing slash", () => {
    expect(() =>
      parseAppRegistry([{ ...baseEntry, mountPath: "/no-trailing-slash" }]),
    ).toThrow(/mountPath/);
  });

  it("rejects duplicate ids", () => {
    expect(() => parseAppRegistry([baseEntry, baseEntry])).toThrow(/id/);
  });

  it("rejects duplicate mount paths", () => {
    expect(() =>
      parseAppRegistry([baseEntry, { ...baseEntry, id: "shell-clone" }]),
    ).toThrow(/mountPath/);
  });

  it("rejects duplicate cloud run service names across in-repo entries", () => {
    expect(() =>
      parseAppRegistry([
        baseEntry,
        {
          ...baseEntry,
          id: "shell-clone",
          mountPath: "/clone/",
          source: { ...baseEntry.source, appDirectoryName: "shell-clone" },
        },
      ]),
    ).toThrow(/cloudRunServiceName/);
  });

  it("rejects duplicate app directory names across in-repo entries", () => {
    expect(() =>
      parseAppRegistry([
        baseEntry,
        {
          ...baseEntry,
          id: "shell-clone",
          mountPath: "/clone/",
          origin: {
            ...baseEntry.origin,
            cloudRunServiceName: "lucaszanoni-shell-clone",
          },
        },
      ]),
    ).toThrow(/appDirectoryName/);
  });

  it("rejects an entry carrying an unexpected property", () => {
    expect(() => parseAppRegistry([{ ...baseEntry, surprise: true }])).toThrow(
      AppRegistryValidationError,
    );
  });

  it("rejects an access model carrying a foreign property", () => {
    expect(() =>
      parseAppRegistry([
        {
          ...baseEntry,
          accessModel: { environment: "public", audienceKey: "x" },
        },
      ]),
    ).toThrow(AppRegistryValidationError);
  });

  describe("optional healthProbePath", () => {
    it("leaves healthProbePath undefined when the entry omits it", () => {
      const parsed = parseAppRegistry([baseEntry]);
      expect(parsed[0]?.healthProbePath).toBeUndefined();
    });

    it("accepts and exposes an absolute healthProbePath", () => {
      const parsed = parseAppRegistry([
        { ...baseEntry, healthProbePath: "/health" },
      ]);
      expect(parsed[0]?.healthProbePath).toBe("/health");
    });

    it("rejects a healthProbePath that is not an absolute path", () => {
      expect(() =>
        parseAppRegistry([{ ...baseEntry, healthProbePath: "health" }]),
      ).toThrow(/healthProbePath/);
    });

    it("rejects an empty healthProbePath", () => {
      expect(() =>
        parseAppRegistry([{ ...baseEntry, healthProbePath: "" }]),
      ).toThrow(/healthProbePath/);
    });

    it("rejects a non-string healthProbePath", () => {
      expect(() =>
        parseAppRegistry([{ ...baseEntry, healthProbePath: 42 }]),
      ).toThrow(/healthProbePath/);
    });
  });
});
