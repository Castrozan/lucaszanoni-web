import { describe, expect, it } from "vitest";
import {
  createApplicationSnapshotArtifactLocations,
  createSnapshotArtifactLocations,
  parseSnapshotSiteOrigin,
} from "../src/snapshot-artifacts.ts";

describe("provider-neutral snapshot artifact locations", () => {
  it("moves all browser readers by changing one artifact base URL", () => {
    expect(
      createSnapshotArtifactLocations("https://artifacts.example.test/site/"),
    ).toEqual({
      artifactStoreBaseUrl: "https://artifacts.example.test/site/",
      usageSnapshotsUrl:
        "https://artifacts.example.test/site/aggregate/machine-usage-snapshots.json",
      reportArtifactsBaseUrl: "https://artifacts.example.test/site/reports/",
    });
  });

  it("rejects malformed, credential-bearing, non-HTTPS and ambiguous base URLs", () => {
    for (const baseUrl of [
      "not a URL",
      "http://artifacts.example.test/",
      "https://user:password@example.test/",
      "https://example.test",
      "https://example.test/?token=value",
      "https://example.test/#fragment",
    ]) {
      expect(() => createSnapshotArtifactLocations(baseUrl)).toThrow();
    }
  });
});

describe("per-application snapshot artifact locations", () => {
  const expectedLocationsByApplication = {
    "usage-dashboard": {
      artifactStoreBaseUrl:
        "https://lucaszanoni.com/engineering/dotfiles/claude/usage/data/",
      usageSnapshotsUrl:
        "https://lucaszanoni.com/engineering/dotfiles/claude/usage/data/aggregate/machine-usage-snapshots.json",
      reportArtifactsBaseUrl:
        "https://lucaszanoni.com/engineering/dotfiles/claude/usage/data/reports/",
    },
    reports: {
      artifactStoreBaseUrl:
        "https://lucaszanoni.com/engineering/dotfiles/reports/data/",
      usageSnapshotsUrl:
        "https://lucaszanoni.com/engineering/dotfiles/reports/data/aggregate/machine-usage-snapshots.json",
      reportArtifactsBaseUrl:
        "https://lucaszanoni.com/engineering/dotfiles/reports/data/reports/",
    },
    cockpit: {
      artifactStoreBaseUrl: "https://lucaszanoni.com/cockpit/data/",
      usageSnapshotsUrl:
        "https://lucaszanoni.com/cockpit/data/aggregate/machine-usage-snapshots.json",
      reportArtifactsBaseUrl: "https://lucaszanoni.com/cockpit/data/reports/",
    },
  } as const;

  for (const [applicationId, expectedLocations] of Object.entries(
    expectedLocationsByApplication,
  )) {
    it(`derives ${applicationId} locations beneath its own mount`, () => {
      expect(createApplicationSnapshotArtifactLocations(applicationId)).toEqual(
        expectedLocations,
      );
    });
  }

  it("fails clearly for an unknown application identifier", () => {
    for (const applicationId of ["", "missing-application", "Cockpit"]) {
      expect(() =>
        createApplicationSnapshotArtifactLocations(applicationId),
      ).toThrow(`Unknown application for snapshot artifacts: ${applicationId}`);
    }
  });

  it("accepts only a credential-free HTTPS origin with the root path", () => {
    expect(parseSnapshotSiteOrigin("https://lucaszanoni.com").href).toBe(
      "https://lucaszanoni.com/",
    );
    expect(parseSnapshotSiteOrigin("https://lucaszanoni.com/").href).toBe(
      "https://lucaszanoni.com/",
    );
    for (const siteOrigin of [
      "not a URL",
      "http://lucaszanoni.com",
      "https://user:password@lucaszanoni.com",
      "https://user@lucaszanoni.com",
      "https://lucaszanoni.com/cockpit/",
      "https://lucaszanoni.com/?token=value",
      "https://lucaszanoni.com/#fragment",
      "https://lucaszanoni.com?",
      "https://lucaszanoni.com#",
    ]) {
      expect(() => parseSnapshotSiteOrigin(siteOrigin)).toThrow();
    }
  });
});
