import { describe, expect, it } from "vitest";
import appRegistryDocument from "../src/app-registry.json";
import { parseAppRegistry } from "../src/app-registry-parser";
import { AppRegistryValidationError } from "../src/app-registry-types";
import { shellApp } from "./app-registry-test-fixtures";

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

  it("rejects an unknown access model kind", () => {
    expect(() =>
      parseAppRegistry([{ ...baseEntry, accessModel: { kind: "everyone" } }]),
    ).toThrow(AppRegistryValidationError);
  });

  it("rejects a shared access model without an audience key", () => {
    expect(() =>
      parseAppRegistry([{ ...baseEntry, accessModel: { kind: "shared" } }]),
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
          origin: { ...baseEntry.origin, appDirectoryName: "shell-clone" },
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
        { ...baseEntry, accessModel: { kind: "public", audienceKey: "x" } },
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
