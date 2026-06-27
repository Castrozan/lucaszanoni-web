import { useState } from "react";
import { Button } from "@platform/design-system";
import {
  readGitlabReviewConfig,
  type GitlabReviewConfig,
} from "./gitlab-review-config";
import {
  buildMergeRequestReviewUrl,
  buildWebIdeBranchUrl,
} from "./gitlab-review-links";

export interface SessionReviewPairingProps {
  config?: GitlabReviewConfig;
}

interface ReviewDeepLink {
  label: string;
  href: string | null;
}

function ReviewDeepLinkButton({ label, href }: ReviewDeepLink) {
  if (!href) {
    return (
      <Button type="button" variant="outline" size="sm" disabled>
        {label}
      </Button>
    );
  }
  return (
    <Button asChild variant="outline" size="sm">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
      >
        {label}
      </a>
    </Button>
  );
}

export function SessionReviewPairing({
  config = readGitlabReviewConfig(),
}: SessionReviewPairingProps) {
  const [branch, setBranch] = useState(config.defaultBranch);

  if (config.baseUrl.length === 0 || config.projectPath.length === 0) {
    return (
      <section
        aria-label="GitLab review pairing"
        className="flex items-center gap-2 border-b border-border bg-surface px-4 py-2"
      >
        <span className="font-mono text-[10px] uppercase tracking-[2px] text-text-faint">
          Review
        </span>
        <p className="m-0 font-mono text-[11px] text-muted-foreground">
          Set VITE_COCKPIT_GITLAB_BASE_URL and VITE_COCKPIT_GITLAB_PROJECT to
          configure the GitLab host for this machine.
        </p>
      </section>
    );
  }

  const target = {
    baseUrl: config.baseUrl,
    projectPath: config.projectPath,
    branch,
  };

  return (
    <section
      aria-label="GitLab review pairing"
      className="flex flex-wrap items-center gap-2 border-b border-border bg-surface px-4 py-2"
    >
      <span className="font-mono text-[10px] uppercase tracking-[2px] text-text-faint">
        Review
      </span>
      <input
        aria-label="Review branch"
        value={branch}
        onChange={(event) => setBranch(event.target.value)}
        placeholder="branch"
        className="h-8 rounded-md border border-input bg-background px-2 font-mono text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <ReviewDeepLinkButton
        label="Open merge request review"
        href={buildMergeRequestReviewUrl(target)}
      />
      <ReviewDeepLinkButton
        label="Open Web IDE"
        href={buildWebIdeBranchUrl(target)}
      />
    </section>
  );
}
