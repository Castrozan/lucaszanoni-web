import { afterEach, describe, expect, it, vi } from "vitest";
import { readGitHubReviewConfig } from "../../src/review/github-review-config";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("readGitHubReviewConfig", () => {
  it("reads the repository URL and falls back to the main branch when no branch override is configured", () => {
    vi.stubEnv("VITE_COCKPIT_REPOSITORY_URL", "https://github.com/example/app");

    expect(readGitHubReviewConfig()).toEqual({
      repositoryUrl: "https://github.com/example/app",
      defaultBranch: "main",
    });
  });

  it("uses the configured branch override when one is present", () => {
    vi.stubEnv("VITE_COCKPIT_REVIEW_BRANCH", "feature/login");

    expect(readGitHubReviewConfig().defaultBranch).toBe("feature/login");
  });

  it("preserves configured identifiers instead of repairing whitespace", () => {
    vi.stubEnv("VITE_COCKPIT_REVIEW_BRANCH", "   ");
    vi.stubEnv(
      "VITE_COCKPIT_REPOSITORY_URL",
      " https://github.com/example/app ",
    );

    expect(readGitHubReviewConfig()).toEqual({
      repositoryUrl: " https://github.com/example/app ",
      defaultBranch: "   ",
    });
  });

  it("reports an empty repository URL when none is configured", () => {
    vi.stubEnv("VITE_COCKPIT_REPOSITORY_URL", "");

    expect(readGitHubReviewConfig().repositoryUrl).toBe("");
  });

  it("ignores the retired GitLab variables", () => {
    vi.stubEnv("VITE_COCKPIT_GITLAB_BASE_URL", "https://gitlab.example.com");
    vi.stubEnv("VITE_COCKPIT_GITLAB_PROJECT", "group/app");
    vi.stubEnv("VITE_COCKPIT_GITLAB_BRANCH", "legacy");

    expect(readGitHubReviewConfig()).toEqual({
      repositoryUrl: "",
      defaultBranch: "main",
    });
  });
});
