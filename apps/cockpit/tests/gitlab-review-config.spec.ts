import { afterEach, describe, expect, it, vi } from "vitest";
import { readGitlabReviewConfig } from "../src/review/gitlab-review-config";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("readGitlabReviewConfig", () => {
  it("falls back to the main branch so the review controls are live by default when no branch override is configured", () => {
    vi.stubEnv("VITE_COCKPIT_GITLAB_BASE_URL", "https://gitlab.example.com");
    vi.stubEnv("VITE_COCKPIT_GITLAB_PROJECT", "group/app");

    expect(readGitlabReviewConfig().defaultBranch).toBe("main");
  });

  it("uses the configured branch override when one is present", () => {
    vi.stubEnv("VITE_COCKPIT_GITLAB_BRANCH", "feature/login");

    expect(readGitlabReviewConfig().defaultBranch).toBe("feature/login");
  });

  it("falls back to the main branch when the configured override is blank", () => {
    vi.stubEnv("VITE_COCKPIT_GITLAB_BRANCH", "   ");

    expect(readGitlabReviewConfig().defaultBranch).toBe("main");
  });
});
