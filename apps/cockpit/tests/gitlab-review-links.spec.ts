import { describe, expect, it } from "vitest";
import {
  buildMergeRequestReviewUrl,
  buildWebIdeBranchUrl,
} from "../src/review/gitlab-review-links";

const host = {
  baseUrl: "https://gitlab.example.com",
  projectPath: "group/app",
};

describe("gitlab review deep links", () => {
  it("builds a merge-requests view filtered to the source branch for review", () => {
    expect(
      buildMergeRequestReviewUrl({ ...host, branch: "feature/login" }),
    ).toBe(
      "https://gitlab.example.com/group/app/-/merge_requests?scope=all&state=opened&source_branch=feature%2Flogin",
    );
  });

  it("builds a Web IDE deep link that preserves slashes in the branch path", () => {
    expect(buildWebIdeBranchUrl({ ...host, branch: "feature/login" })).toBe(
      "https://gitlab.example.com/-/ide/project/group/app/edit/feature/login/-/",
    );
  });

  it("encodes unsafe characters in a Web IDE branch segment without escaping slashes", () => {
    expect(buildWebIdeBranchUrl({ ...host, branch: "fix/odd branch" })).toBe(
      "https://gitlab.example.com/-/ide/project/group/app/edit/fix/odd%20branch/-/",
    );
  });

  it("normalizes a trailing slash on the host and surrounding slashes on the project", () => {
    expect(
      buildMergeRequestReviewUrl({
        baseUrl: "https://gitlab.example.com/",
        projectPath: "/group/app/",
        branch: "main",
      }),
    ).toBe(
      "https://gitlab.example.com/group/app/-/merge_requests?scope=all&state=opened&source_branch=main",
    );
  });

  it("returns null when the host, project, or branch is missing so nothing is linked", () => {
    expect(
      buildMergeRequestReviewUrl({
        baseUrl: "",
        projectPath: "group/app",
        branch: "main",
      }),
    ).toBeNull();
    expect(
      buildMergeRequestReviewUrl({
        baseUrl: "https://gitlab.example.com",
        projectPath: "",
        branch: "main",
      }),
    ).toBeNull();
    expect(buildMergeRequestReviewUrl({ ...host, branch: "  " })).toBeNull();
    expect(buildWebIdeBranchUrl({ ...host, branch: "" })).toBeNull();
  });
});
