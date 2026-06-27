import { describe, expect, it } from "vitest";
import {
  baselineArtifactUrl,
  coverageArtifactUrl,
  reportArtifactBucketBaseUrl,
} from "../../src/data/report-artifact-sources";

describe("report artifact sources", () => {
  it("points the bucket base url at the public reports prefix", () => {
    expect(reportArtifactBucketBaseUrl).toBe(
      "https://storage.googleapis.com/zg-url-shortener-2026-dotfiles-usage-snapshots/reports/",
    );
  });

  it("derives the baseline artifact url under the reports prefix", () => {
    expect(baselineArtifactUrl).toBe(
      "https://storage.googleapis.com/zg-url-shortener-2026-dotfiles-usage-snapshots/reports/baseline/index.html",
    );
  });

  it("derives the coverage artifact url under the reports prefix", () => {
    expect(coverageArtifactUrl).toBe(
      "https://storage.googleapis.com/zg-url-shortener-2026-dotfiles-usage-snapshots/reports/coverage/index.html",
    );
  });
});
