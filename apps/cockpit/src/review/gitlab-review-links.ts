export interface GitlabReviewTarget {
  baseUrl: string;
  projectPath: string;
  branch: string;
}

interface ResolvedReviewTarget {
  base: string;
  project: string;
  branch: string;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, "");
}

function normalizeProjectPath(projectPath: string): string {
  return projectPath.trim().replace(/^\/+/, "").replace(/\/+$/, "");
}

function encodeBranchPath(branch: string): string {
  return branch
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function resolveReviewTarget(
  target: GitlabReviewTarget,
): ResolvedReviewTarget | null {
  const base = normalizeBaseUrl(target.baseUrl);
  const project = normalizeProjectPath(target.projectPath);
  const branch = target.branch.trim();
  if (base.length === 0 || project.length === 0 || branch.length === 0) {
    return null;
  }
  return { base, project, branch };
}

export function buildMergeRequestReviewUrl(
  target: GitlabReviewTarget,
): string | null {
  const resolved = resolveReviewTarget(target);
  if (!resolved) {
    return null;
  }
  const sourceBranch = encodeURIComponent(resolved.branch);
  return `${resolved.base}/${resolved.project}/-/merge_requests?scope=all&state=opened&source_branch=${sourceBranch}`;
}

export function buildWebIdeBranchUrl(
  target: GitlabReviewTarget,
): string | null {
  const resolved = resolveReviewTarget(target);
  if (!resolved) {
    return null;
  }
  return `${resolved.base}/-/ide/project/${resolved.project}/edit/${encodeBranchPath(resolved.branch)}/-/`;
}
