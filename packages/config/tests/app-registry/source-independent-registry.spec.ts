import { describe, expect, it } from "vitest";
import { parseAppRegistry } from "../../src/app-registry/parser";
import { AppRegistryValidationError } from "../../src/app-registry/types";
import { cockpitApp, shellApp } from "./test-fixtures";

describe("Worker static assets", () => {
  it("preserves the private owner policy on a Worker origin", () => {
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

  it("rejects duplicate source directories across entries", () => {
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
  it("requires source for a Worker origin", () => {
    const { source: _source, ...entry } = cockpitApp;
    expect(() => parseAppRegistry([entry])).toThrow(
      /requires repository source/,
    );
  });

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
      { ...shellApp.source, misplacedField: "misplaced" },
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

  it.each(["in-repo-worker-assets"])("rejects obsolete origin %s", (kind) => {
    expect(() =>
      parseAppRegistry([{ ...shellApp, origin: { ...shellApp.origin, kind } }]),
    ).toThrow(/kind/);
  });

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
});
