export interface GitHubReviewTarget {
  repositoryUrl: string;
  branch: string;
}

interface GitHubRepository {
  owner: string;
  name: string;
}

const REPOSITORY_URL_PATTERN =
  /^https:\/\/github\.com\/([A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?)\/((?!\.{1,2}$)[A-Za-z0-9._-]{1,100})$/;

const FORBIDDEN_BRANCH_CHARACTERS = /[\u0000- \u007f~^:?*[\\]/;

function parseRepository(repositoryUrl: string): GitHubRepository | null {
  const [, owner, name] = REPOSITORY_URL_PATTERN.exec(repositoryUrl) ?? [];
  if (owner === undefined || name === undefined) {
    return null;
  }
  return { owner, name };
}

function isValidBranchName(branch: string): boolean {
  if (branch.length === 0 || FORBIDDEN_BRANCH_CHARACTERS.test(branch)) {
    return false;
  }
  return !(
    branch.startsWith("-") ||
    branch.startsWith("/") ||
    branch.endsWith("/") ||
    branch.endsWith(".") ||
    branch.endsWith(".lock") ||
    branch.includes("//") ||
    branch.includes("..") ||
    branch.includes("@{")
  );
}

function resolveTarget(
  target: GitHubReviewTarget,
): (GitHubRepository & { branch: string }) | null {
  const repository = parseRepository(target.repositoryUrl);
  if (!repository || !isValidBranchName(target.branch)) {
    return null;
  }
  return { ...repository, branch: target.branch };
}

export function buildPullRequestReviewUrl(
  target: GitHubReviewTarget,
): string | null {
  const resolved = resolveTarget(target);
  if (!resolved) {
    return null;
  }
  const query = new URLSearchParams({
    q: `is:pr is:open head:${resolved.branch}`,
  });
  return `https://github.com/${resolved.owner}/${resolved.name}/pulls?${query.toString()}`;
}

export function buildBrowserEditorUrl(
  target: GitHubReviewTarget,
): string | null {
  const resolved = resolveTarget(target);
  if (!resolved) {
    return null;
  }
  return `https://github.dev/${resolved.owner}/${resolved.name}/tree/${encodeURIComponent(resolved.branch)}`;
}
