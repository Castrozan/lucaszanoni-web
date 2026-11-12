import { useState } from "react";
import { Button } from "@platform/design-system";
import {
  readGitHubReviewConfig,
  type GitHubReviewConfig,
} from "./github-review-config";
import {
  buildBrowserEditorUrl,
  buildPullRequestReviewUrl,
} from "./github-review-links";

export interface SessionReviewPairingProps {
  config?: GitHubReviewConfig;
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
  config = readGitHubReviewConfig(),
}: SessionReviewPairingProps) {
  const [branch, setBranch] = useState(config.defaultBranch);

  if (config.repositoryUrl.length === 0) {
    return (
      <section
        aria-label="GitHub review pairing"
        className="flex items-center gap-2 border-b border-border bg-surface px-4 py-2"
      >
        <span className="font-mono text-[10px] uppercase tracking-[2px] text-text-faint">
          Review
        </span>
        <p className="m-0 font-mono text-[11px] text-muted-foreground">
          Set VITE_COCKPIT_REPOSITORY_URL to configure the GitHub repository for
          this machine.
        </p>
      </section>
    );
  }

  const target = {
    repositoryUrl: config.repositoryUrl,
    branch,
  };

  return (
    <section
      aria-label="GitHub review pairing"
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
        label="Open pull request review"
        href={buildPullRequestReviewUrl(target)}
      />
      <ReviewDeepLinkButton
        label="Open GitHub editor"
        href={buildBrowserEditorUrl(target)}
      />
    </section>
  );
}
