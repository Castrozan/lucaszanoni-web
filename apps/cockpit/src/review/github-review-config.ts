export interface GitHubReviewConfig {
  repositoryUrl: string;
  defaultBranch: string;
}

export function readGitHubReviewConfig(): GitHubReviewConfig {
  return {
    repositoryUrl: import.meta.env.VITE_COCKPIT_REPOSITORY_URL ?? "",
    defaultBranch: import.meta.env.VITE_COCKPIT_REVIEW_BRANCH || "main",
  };
}
