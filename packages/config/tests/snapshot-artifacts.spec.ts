import { describe, expect, it } from "vitest";
import { createSnapshotArtifactLocations } from "../src/snapshot-artifacts.ts";

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
