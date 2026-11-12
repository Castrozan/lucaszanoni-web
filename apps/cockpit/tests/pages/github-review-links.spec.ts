import { describe, expect, it } from "vitest";
import {
  buildBrowserEditorUrl,
  buildPullRequestReviewUrl,
} from "../../src/review/github-review-links";

const repositoryUrl = "https://github.com/example/app";

describe("github review deep links", () => {
  it("builds an open pull request search filtered to the head branch", () => {
    expect(
      buildPullRequestReviewUrl({ repositoryUrl, branch: "feature/login" }),
    ).toBe(
      "https://github.com/example/app/pulls?q=is%3Apr+is%3Aopen+head%3Afeature%2Flogin",
    );
  });

  it("builds a github.dev editor link that encodes the whole branch as one segment", () => {
    expect(
      buildBrowserEditorUrl({ repositoryUrl, branch: "feature/login" }),
    ).toBe("https://github.dev/example/app/tree/feature%2Flogin");
  });

  it("preserves valid branch names literally and encodes reserved characters safely", () => {
    const branch = "fix/a#b%c+d&e=f";
    expect(buildBrowserEditorUrl({ repositoryUrl, branch })).toBe(
      `https://github.dev/example/app/tree/${encodeURIComponent(branch)}`,
    );
    const reviewUrl = new URL(
      buildPullRequestReviewUrl({ repositoryUrl, branch }) ?? "",
    );
    expect(reviewUrl.searchParams.get("q")).toBe(
      `is:pr is:open head:${branch}`,
    );
    expect(reviewUrl.hash).toBe("");
  });

  it("accepts dotted, hyphenated and underscored owner and repository names", () => {
    expect(
      buildBrowserEditorUrl({
        repositoryUrl: "https://github.com/Castro-zan/lucas_web.site",
        branch: "main",
      }),
    ).toBe("https://github.dev/Castro-zan/lucas_web.site/tree/main");
  });

  it.each([
    "",
    "   ",
    "http://github.com/example/app",
    "https://gitlab.com/example/app",
    "https://www.github.com/example/app",
    "https://github.com.evil.test/example/app",
    "https://user@github.com/example/app",
    "https://user:token@github.com/example/app",
    "https://github.com:8443/example/app",
    "https://github.com/example/app?tab=readme",
    "https://github.com/example/app#readme",
    "https://github.com/example/app/",
    "https://github.com/example/app/tree/main",
    "https://github.com/example",
    "https://github.com//app",
    "https://github.com/-example/app",
    "https://github.com/example-/app",
    "https://github.com/exa mple/app",
    "https://github.com/example/..",
    " https://github.com/example/app",
    "https://github.com/example/app\n",
    "https://github.com/example/app\r\n",
    "github.com/example/app",
  ])("rejects the malformed repository %j", (malformed) => {
    expect(
      buildPullRequestReviewUrl({
        repositoryUrl: malformed,
        branch: "main",
      }),
    ).toBeNull();
    expect(
      buildBrowserEditorUrl({ repositoryUrl: malformed, branch: "main" }),
    ).toBeNull();
  });

  it.each([
    "",
    "  ",
    " main",
    "main ",
    "odd branch",
    "-flag",
    "/leading",
    "trailing/",
    "double//slash",
    "dots..here",
    "ends.",
    "ends.lock",
    "reflog@{1}",
    "tilde~1",
    "caret^",
    "colon:name",
    "question?",
    "star*",
    "bracket[",
    "back\\slash",
    "control\u0007char",
  ])("rejects the invalid branch %j", (branch) => {
    expect(buildPullRequestReviewUrl({ repositoryUrl, branch })).toBeNull();
    expect(buildBrowserEditorUrl({ repositoryUrl, branch })).toBeNull();
  });
});
