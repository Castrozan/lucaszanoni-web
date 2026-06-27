export interface GitlabReviewConfig {
  baseUrl: string;
  projectPath: string;
  defaultBranch: string;
}

export function readGitlabReviewConfig(): GitlabReviewConfig {
  return {
    baseUrl: (import.meta.env.VITE_COCKPIT_GITLAB_BASE_URL ?? "").trim(),
    projectPath: (import.meta.env.VITE_COCKPIT_GITLAB_PROJECT ?? "").trim(),
    defaultBranch: (import.meta.env.VITE_COCKPIT_GITLAB_BRANCH ?? "").trim(),
  };
}
