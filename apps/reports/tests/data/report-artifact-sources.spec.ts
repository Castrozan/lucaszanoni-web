import { describe, expect, it } from "vitest";
import {
  baselineArtifactUrl,
  coverageArtifactUrl,
  reportArtifactsBaseUrl,
} from "../../src/data/report-artifact-sources";

describe("report artifact sources", () => {
  it("points the bucket base url at the public reports prefix", () => {
    expect(reportArtifactsBaseUrl).toBe(
      "https://lucaszanoni.com/engineering/dotfiles/reports/data/reports/",
    );
  });

  it("derives the baseline artifact url under the reports prefix", () => {
    expect(baselineArtifactUrl).toBe(
      "https://lucaszanoni.com/engineering/dotfiles/reports/data/reports/baseline/index.html",
    );
  });

  it("derives the coverage artifact url under the reports prefix", () => {
    expect(coverageArtifactUrl).toBe(
      "https://lucaszanoni.com/engineering/dotfiles/reports/data/reports/coverage/index.html",
    );
  });
});
