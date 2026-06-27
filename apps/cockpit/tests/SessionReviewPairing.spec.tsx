import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SessionReviewPairing } from "../src/review/SessionReviewPairing";

const configured = {
  baseUrl: "https://gitlab.example.com",
  projectPath: "group/app",
  defaultBranch: "feature/login",
};

afterEach(cleanup);

describe("SessionReviewPairing", () => {
  it("shows an empty state and no review links when the GitLab host is unconfigured", () => {
    render(
      <SessionReviewPairing
        config={{ baseUrl: "", projectPath: "", defaultBranch: "" }}
      />,
    );

    expect(screen.getByText(/configure the gitlab host/i)).toBeDefined();
    expect(
      screen.queryByRole("link", { name: "Open merge request review" }),
    ).toBeNull();
    expect(screen.queryByRole("link", { name: "Open Web IDE" })).toBeNull();
  });

  it("deep-links the merge request review and Web IDE for the default branch in new tabs", () => {
    render(<SessionReviewPairing config={configured} />);

    const reviewLink = screen.getByRole("link", {
      name: "Open merge request review",
    }) as HTMLAnchorElement;
    const ideLink = screen.getByRole("link", {
      name: "Open Web IDE",
    }) as HTMLAnchorElement;

    expect(reviewLink.getAttribute("href")).toBe(
      "https://gitlab.example.com/group/app/-/merge_requests?scope=all&state=opened&source_branch=feature%2Flogin",
    );
    expect(ideLink.getAttribute("href")).toBe(
      "https://gitlab.example.com/-/ide/project/group/app/edit/feature/login/-/",
    );
    expect(reviewLink.getAttribute("target")).toBe("_blank");
    expect(reviewLink.getAttribute("rel")).toContain("noopener");
    expect(ideLink.getAttribute("target")).toBe("_blank");
  });

  it("retargets the deep links when the owner types a different branch", () => {
    render(<SessionReviewPairing config={configured} />);

    const branchInput = screen.getByLabelText(
      "Review branch",
    ) as HTMLInputElement;
    fireEvent.change(branchInput, { target: { value: "hotfix/crash" } });

    expect(
      (
        screen.getByRole("link", {
          name: "Open merge request review",
        }) as HTMLAnchorElement
      ).getAttribute("href"),
    ).toBe(
      "https://gitlab.example.com/group/app/-/merge_requests?scope=all&state=opened&source_branch=hotfix%2Fcrash",
    );
  });

  it("disables the open controls and renders no links when no branch is set", () => {
    render(
      <SessionReviewPairing config={{ ...configured, defaultBranch: "" }} />,
    );

    expect(
      screen.queryByRole("link", { name: "Open merge request review" }),
    ).toBeNull();
    expect(
      (
        screen.getByRole("button", {
          name: "Open merge request review",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });
});
