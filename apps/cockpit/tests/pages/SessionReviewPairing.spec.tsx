import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SessionReviewPairing } from "../../src/review/SessionReviewPairing";

const configured = {
  repositoryUrl: "https://github.com/example/app",
  defaultBranch: "feature/login",
};

const reviewUrlForBranch = (branch: string) =>
  `https://github.com/example/app/pulls?q=is%3Apr+is%3Aopen+head%3A${encodeURIComponent(branch)}`;

afterEach(cleanup);

describe("SessionReviewPairing", () => {
  it("shows an empty state and no review links when the GitHub repository is unconfigured", () => {
    render(
      <SessionReviewPairing
        config={{ repositoryUrl: "", defaultBranch: "" }}
      />,
    );

    expect(screen.getByText(/configure the github repository/i)).toBeDefined();
    expect(
      screen.queryByRole("link", { name: "Open pull request review" }),
    ).toBeNull();
    expect(
      screen.queryByRole("link", { name: "Open GitHub editor" }),
    ).toBeNull();
  });

  it("deep-links the pull request review and GitHub editor for the default branch in new tabs", () => {
    render(<SessionReviewPairing config={configured} />);

    const reviewLink = screen.getByRole("link", {
      name: "Open pull request review",
    }) as HTMLAnchorElement;
    const ideLink = screen.getByRole("link", {
      name: "Open GitHub editor",
    }) as HTMLAnchorElement;

    expect(reviewLink.getAttribute("href")).toBe(
      reviewUrlForBranch("feature/login"),
    );
    expect(ideLink.getAttribute("href")).toBe(
      "https://github.dev/example/app/tree/feature%2Flogin",
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
          name: "Open pull request review",
        }) as HTMLAnchorElement
      ).getAttribute("href"),
    ).toBe(reviewUrlForBranch("hotfix/crash"));
  });

  it("disables the open controls and renders no links when no branch is set", () => {
    render(
      <SessionReviewPairing config={{ ...configured, defaultBranch: "" }} />,
    );

    expect(
      screen.queryByRole("link", { name: "Open pull request review" }),
    ).toBeNull();
    expect(
      (
        screen.getByRole("button", {
          name: "Open pull request review",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });

  it("disables the open controls and renders no links for an invalid branch", () => {
    render(<SessionReviewPairing config={configured} />);
    fireEvent.change(screen.getByLabelText("Review branch"), {
      target: { value: "odd branch" },
    });

    expect(
      screen.queryByRole("link", { name: "Open pull request review" }),
    ).toBeNull();
    expect(
      (
        screen.getByRole("button", {
          name: "Open GitHub editor",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });

  it("renders no links for a repository URL carrying credentials", () => {
    render(
      <SessionReviewPairing
        config={{
          repositoryUrl: "https://user:token@github.com/example/app",
          defaultBranch: "main",
        }}
      />,
    );

    expect(
      screen.queryByRole("link", { name: "Open pull request review" }),
    ).toBeNull();
    expect(
      screen.queryByRole("link", { name: "Open GitHub editor" }),
    ).toBeNull();
  });

  it("labels the region as GitHub review pairing", () => {
    render(<SessionReviewPairing config={configured} />);

    expect(
      screen.getByRole("region", { name: "GitHub review pairing" }),
    ).toBeDefined();
  });
});
